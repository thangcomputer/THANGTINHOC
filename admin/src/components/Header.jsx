import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Info, MessageSquare, DollarSign, UserPlus } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { getBreadcrumbLabel } from '../lib/crumbs';

const getNotifLink = (type) => {
  if (type === 'PAYMENT') return '/orders';
  if (type === 'COMMENT') return '/qa';
  if (type === 'REGISTER') return '/users';
  if (type === 'CONTACT' || type === 'INQUIRY') return '/inquiries';
  return null;
};

export default function Header({ toggleSidebar }) {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchNotifs = () => {
      api.get('/notifications').then(res => {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }).catch(() => {});
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const breadcrumbLabel = getBreadcrumbLabel(location.pathname);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('Đã đánh dấu đọc tất cả');
    } catch {
      toast.error('Lỗi khi đánh dấu trạng thái');
    }
  };

  const getNotifIcon = (type) => {
    const styles = {
      REGISTER: { bg: 'var(--primary-100)', color: 'var(--primary)' },
      COMMENT: { bg: 'var(--info-bg)', color: 'var(--info)' },
      PAYMENT: { bg: 'var(--success-bg)', color: 'var(--success)' },
    };
    const s = styles[type] || { bg: '#f1f5f9', color: 'var(--text-muted)' };
    const IconComp = type === 'REGISTER' ? UserPlus : type === 'COMMENT' ? MessageSquare : type === 'PAYMENT' ? DollarSign : Bell;
    return (
      <div className="notif-icon" style={{ background: s.bg, color: s.color }}>
        <IconComp size={16} />
      </div>
    );
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={toggleSidebar} aria-label="Toggle menu">
          <Menu size={18} />
        </button>
        <div className="breadcrumb">
          <span style={{ opacity: 0.5 }}>Admin</span>
          <span style={{ opacity: 0.3 }}>/</span>
          <span className="current">{breadcrumbLabel || 'Trang'}</span>
        </div>
      </div>

      <div className="header-right">
        <div className="notification-wrapper" ref={dropdownRef}>
          <button 
            className="notification-btn" 
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="badge-indicator">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notif-header">
                <h4>Thông Báo</h4>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="notif-mark-read">
                    Đọc tất cả
                  </button>
                )}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">
                    <Bell size={32} style={{ opacity: 0.15, marginBottom: 8 }} />
                    <p>Không có thông báo mới</p>
                  </div>
                ) : (
                  notifications.map(n => {
                    const link = getNotifLink(n.type);
                    return (
                      <div
                        key={n.id}
                        className={`notif-item ${!n.isRead ? 'unread' : ''} ${link ? 'notif-clickable' : ''}`}
                        onClick={() => {
                          if (!n.isRead) markAsRead(n.id);
                          if (link) {
                            setShowNotifications(false);
                            navigate(link);
                          }
                        }}
                      >
                        {getNotifIcon(n.type)}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className={`notif-text ${!n.isRead ? 'fw' : ''}`}>
                            {n.message}
                          </div>
                          <div className="notif-time">
                            {formatTime(n.createdAt)}
                            {link && <span style={{ marginLeft: '6px', color: 'var(--primary)', fontSize: '0.7rem' }}>→ Xem</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="header-user">
          <div className="avatar">{user?.fullName?.[0]?.toUpperCase() || 'A'}</div>
          <div className="user-info">
            <span className="user-name">{user?.fullName || 'Admin'}</span>
            <span className="user-role">Quản trị viên</span>
          </div>
        </div>
      </div>
    </header>
  );
}
