import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BookOpen, FileText, Users, Settings, 
  ShoppingCart, LogOut, Terminal, Folder, Layout, MessageSquare,
  Eye, ChevronRight, ClipboardList, Briefcase, Upload, RefreshCw, Loader2,
  Inbox, HelpCircle, FileCheck, PanelLeftClose, PanelLeftOpen, ImageIcon
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import { performLogout } from '../lib/logout';
import { clientPath } from '../lib/clientUrl';
import { filterMenuSections, canAccessMenu } from '../lib/menuPermissions';
import toast from 'react-hot-toast';

const menuSections = [
  {
    label: null,
    items: [
      { to: '/', label: 'Tổng quan', icon: LayoutDashboard, end: true },
    ]
  },
  {
    label: 'NỘI DUNG',
    items: [
      { to: '/courses', label: 'Khóa học', icon: BookOpen },
      { to: '/posts', label: 'Bài viết', icon: FileText },
      { to: '/media', label: 'Quản lý ảnh', icon: ImageIcon },
      { to: '/categories', label: 'Danh mục', icon: Folder },
    ]
  },
  {
    label: 'HỌC VIÊN',
    items: [
      { to: '/users', label: 'Người dùng', icon: Users },
      { to: '/orders', label: 'Đơn hàng', icon: ShoppingCart, badgeKey: 'orders', permKey: 'orders' },
      { to: '/inquiries', label: 'Tin tư vấn', icon: Inbox, badgeKey: 'inquiries' },
      { to: '/qa', label: 'Hỏi đáp', icon: HelpCircle },
    ]
  },
  {
    label: 'TUYỂN SINH',
    items: [
      { to: '/registrations', label: 'Ghi danh', icon: ClipboardList, badgeKey: 'registrations' },
      { to: '/recruitment', label: 'Tuyển dụng GV', icon: Briefcase, badgeKey: 'recruitment' },
      { to: '/submissions', label: 'Bài tập', icon: FileCheck },
    ]
  },
  {
    label: 'GIAO DIỆN',
    items: [
      { to: '/home-cms', label: 'Trang chủ CMS', icon: Layout },
      { to: '/settings', label: 'Cài đặt', icon: Settings, permKey: 'settings' },
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

export default function Sidebar({ isOpen, closeSidebar, collapsed, onToggleCollapse }) {
  const { user } = useAuthStore();
  const visibleSections = filterMenuSections(menuSections, user?.role);
  const showCachePurge = canAccessMenu(user?.role, 'cache');
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
      toast.success(`Đã xóa cache. RAM: ${stats?.serverMemory}, uptime: ${stats?.uptime}`);
      // Refetch badges
      fetchBadges();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi xóa cache');
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
    <aside className={`sidebar ${isOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
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
        {visibleSections.map((section, sIdx) => (
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
                  onClick={() => closeSidebar()}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={18} strokeWidth={1.8} aria-hidden />
                  {!collapsed && <span>{item.label}</span>}
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
          href={clientPath('/')}
          target="_blank" 
          rel="noreferrer" 
          className="sidebar-link sidebar-link-external"
          title={collapsed ? 'Xem trang web' : undefined}
        >
          <Eye size={18} strokeWidth={1.8} aria-hidden />
          {!collapsed && <span>Xem trang web</span>}
          {!collapsed && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
        </a>
        <button
          type="button"
          className="sidebar-link"
          onClick={onToggleCollapse}
          title={collapsed ? 'Mo rong menu' : 'Thu gon menu'}
          aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          {!collapsed && <span>{collapsed ? 'Mở rộng' : 'Thu gọn menu'}</span>}
        </button>
        {showCachePurge && (
        <button
          type="button"
          className="sidebar-link sidebar-link-cache"
          onClick={handlePurgeCache}
          disabled={purging}
          style={{ opacity: purging ? 0.6 : 1 }}
          aria-label="Xóa cache server"
        >
          {purging
            ? <Loader2 size={18} strokeWidth={1.8} className="spin-icon" />
            : <RefreshCw size={18} strokeWidth={1.8} />
          }
          {!collapsed && <span>{purging ? 'Đang xóa cache...' : 'Xóa cache server'}</span>}
        </button>
        )}
        <button type="button" className="sidebar-link sidebar-link-logout" onClick={() => performLogout()}>
          <LogOut size={18} strokeWidth={1.8} />
          {!collapsed && <span>Đăng xuất</span>}
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
