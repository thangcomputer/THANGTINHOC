import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BookOpen, FileText, Users, Settings, 
  ShoppingCart, LogOut, Terminal, Folder, Layout, MessageSquare,
  Eye, Palette, ChevronRight, ClipboardList, Briefcase, Upload, RefreshCw, Loader2
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../lib/api';

const menuSections = [
  {
    label: null,
    items: [
      { to: '/', label: 'Tổng Quan', icon: LayoutDashboard, end: true },
    ]
  },
  {
    label: 'NỘI DUNG',
    items: [
      { to: '/courses', label: 'Khóa Học', icon: BookOpen },
      { to: '/posts', label: 'Bài Viết', icon: FileText },
      { to: '/media', label: 'Quản Lý Ảnh', icon: Upload },
      { to: '/categories', label: 'Danh Mục', icon: Folder },
    ]
  },
  {
    label: 'HỌC VIÊN',
    items: [
      { to: '/users', label: 'Người Dùng', icon: Users },
      { to: '/orders', label: 'Đơn Hàng', icon: ShoppingCart, badgeKey: 'orders' },
      { to: '/inquiries', label: 'Tin Nhắn Tư Vấn', icon: MessageSquare, badgeKey: 'inquiries' },
      { to: '/qa', label: 'Hỏi Đáp', icon: MessageSquare },
    ]
  },
  {
    label: 'TUYỂN SINH',
    items: [
      { to: '/registrations', label: 'Ghi Danh', icon: ClipboardList, badgeKey: 'registrations' },
      { to: '/recruitment', label: 'Tuyển Dụng GV', icon: Briefcase, badgeKey: 'recruitment' },
      { to: '/submissions', label: 'Bài Tập', icon: Upload },
    ]
  },
  {
    label: 'GIAO DIỆN',
    items: [
      { to: '/home-cms', label: 'Trang Chủ CMS', icon: Layout },
      { to: '/settings', label: 'Cài Đặt Chung', icon: Settings },
    ]
  },
];

// API endpoints — đúng với backend thực tế
const BADGE_APIS = {
  // Đếm tin nhắn chưa đọc (isRead = false)
  inquiries: () => api.get('/contacts').then(r => {
    const data = r.data?.data || [];
    return Array.isArray(data) ? data.filter(m => !m.isRead).length : 0;
  }),
  // Đếm đơn hàng pending
  orders: () => api.get('/orders?status=pending').then(r => r.data?.pagination?.total || 0),
  // Đếm ghi danh chưa đọc
  registrations: () => api.get('/registrations/admin/all').then(r => {
    const data = r.data?.data || [];
    return Array.isArray(data) ? data.filter(m => !m.isRead).length : 0;
  }),
  // Đếm đơn tuyển dụng chưa đọc
  recruitment: () => api.get('/recruitment/admin/all').then(r => {
    const data = r.data?.data || [];
    return Array.isArray(data) ? data.filter(m => !m.isRead).length : 0;
  }),
};

export default function Sidebar({ isOpen, closeSidebar }) {
  const { logout } = useAuthStore();
  const [badges, setBadges] = useState({});
  const [purging, setPurging] = useState(false);

  const handlePurgeCache = async () => {
    if (purging) return;
    setPurging(true);
    try {
      const res = await api.post('/cache/purge');
      // Clear browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      // Notify all open client tabs to refetch
      if (window.BroadcastChannel) {
        const bc = new BroadcastChannel('cache_purge');
        bc.postMessage({ type: 'CACHE_PURGED', timestamp: Date.now() });
        bc.close();
      }
      const stats = res.data?.data;
      alert(`✅ Cache đã được xóa thành công!\n\n📊 Server Memory: ${stats?.serverMemory}\n⏱️ Uptime: ${stats?.uptime}\n🔄 Prisma: Reconnected`);
      // Refetch badges
      fetchBadges();
    } catch (err) {
      alert('❌ Lỗi khi xóa cache: ' + (err.response?.data?.message || err.message));
    } finally {
      setPurging(false);
    }
  };

  const fetchBadges = async () => {
    const results = {};
    await Promise.allSettled(
      Object.entries(BADGE_APIS).map(async ([key, fn]) => {
        try { results[key] = await fn(); } catch { results[key] = 0; }
      })
    );
    setBadges(results);
  };

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000); // refresh mỗi 30s
    return () => clearInterval(interval);
  }, []);

  const totalUnread = Object.values(badges).reduce((sum, v) => sum + (v || 0), 0);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon-wrap">
          <Terminal size={20} strokeWidth={2.5} />
        </div>
        <div className="logo-text">
          <span className="logo-name">Thắng Admin</span>
          <span className="logo-sub">Bảng điều khiển</span>
        </div>
        {totalUnread > 0 && (
          <span style={{
            marginLeft: 'auto',
            background: '#ef4444',
            color: 'white',
            fontSize: '0.65rem',
            fontWeight: 800,
            minWidth: '20px',
            height: '20px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 6px',
            flexShrink: 0,
          }}>
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </div>

      <nav className="sidebar-nav">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="sidebar-section">
            {section.label && (
              <div className="sidebar-section-label">{section.label}</div>
            )}
            {section.items.map((item) => {
              const count = item.badgeKey ? (badges[item.badgeKey] || 0) : 0;
              return (
                <NavLink 
                  key={item.to} 
                  to={item.to} 
                  end={item.end || false}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    closeSidebar();
                    // Xóa badge ngay khi bấm vào
                    if (item.badgeKey && badges[item.badgeKey]) {
                      setBadges(prev => ({ ...prev, [item.badgeKey]: 0 }));
                    }
                  }}
                >
                  <item.icon size={18} strokeWidth={1.8} />
                  <span>{item.label}</span>
                  {count > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      background: '#ef4444',
                      color: 'white',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '9px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 5px',
                      flexShrink: 0,
                      animation: 'badgePulse 2s ease-in-out infinite',
                    }}>
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <a 
          href="http://localhost:5173" 
          target="_blank" 
          rel="noreferrer" 
          className="sidebar-link sidebar-link-external"
        >
          <Eye size={18} strokeWidth={1.8} />
          <span>Xem Trang Web</span>
          <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
        </a>
        <button 
          className="sidebar-link sidebar-link-cache" 
          onClick={handlePurgeCache}
          disabled={purging}
          style={{ opacity: purging ? 0.6 : 1 }}
        >
          {purging 
            ? <Loader2 size={18} strokeWidth={1.8} className="spin-icon" /> 
            : <RefreshCw size={18} strokeWidth={1.8} />
          }
          <span>{purging ? 'Đang xóa cache...' : 'Refetch Cache'}</span>
        </button>
        <button className="sidebar-link sidebar-link-logout" onClick={logout}>
          <LogOut size={18} strokeWidth={1.8} />
          <span>Đăng Xuất</span>
        </button>
      </div>

      <style>{`
        @keyframes badgePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          50% { box-shadow: 0 0 0 4px rgba(239,68,68,0); }
        }
        .spin-icon { animation: spinAnim 1s linear infinite; }
        @keyframes spinAnim { to { transform: rotate(360deg); } }
        .sidebar-link-cache {
          color: #22d3ee !important;
          transition: all 0.2s;
        }
        .sidebar-link-cache:hover {
          background: rgba(34,211,238,0.08) !important;
        }
        .sidebar-link-cache:disabled {
          cursor: not-allowed;
        }
      `}</style>
    </aside>
  );
}
