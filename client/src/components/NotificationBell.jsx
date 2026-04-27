import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, Award, Trophy, Clock, X, CheckCircle, Check, MessageSquare } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import './NotificationBell.css';

const ICON_MAP = {
  check:  <CheckCircle size={16} />,
  clock:  <Clock size={16} />,
  x:      <X size={16} />,
  award:  <Award size={16} />,
  trophy: <Trophy size={16} />,
};

const TYPE_COLORS = {
  ORDER:    { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
  GRADE:    { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24' },
  COMPLETE: { bg: 'rgba(168,85,247,0.15)',  color: '#a855f7' },
  REPLY:    { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8' },
};

// Use timestamp: any notification newer than lastSeen is unread
const STORAGE_KEY = 'nb_last_seen';
const MAX_VISIBLE = 5;

function getLastSeen() {
  const v = localStorage.getItem(STORAGE_KEY);
  return v ? new Date(v) : new Date(0);
}
function saveLastSeen(date) {
  localStorage.setItem(STORAGE_KEY, date.toISOString());
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'Vừa xong';
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export default function NotificationBell() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [lastSeen, setLastSeen] = useState(() => getLastSeen());
  const [showAll, setShowAll] = useState(false);
  const ref = useRef(null);
  const markTimerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifs = () => {
    api.get('/notifications/student').then(res => {
      setNotifs(res.data.data || []);
    }).catch(() => {});
  };

  const markAllRead = () => {
    const now = new Date();
    setLastSeen(now);
    saveLastSeen(now);
  };

  // Auto-mark after 3s when dropdown opens
  useEffect(() => {
    if (open && notifs.length > 0) {
      clearTimeout(markTimerRef.current);
      markTimerRef.current = setTimeout(markAllRead, 3000);
    }
    return () => clearTimeout(markTimerRef.current);
  }, [open]);

  // unread = notifs newer than lastSeen
  const unreadCount = notifs.filter(n => new Date(n.createdAt) > lastSeen).length;
  const visibleNotifs = showAll ? notifs : notifs.slice(0, MAX_VISIBLE);
  const hasMore = notifs.length > MAX_VISIBLE;

  if (!isAuthenticated) return null;

  return (
    <div className="nb-wrapper" ref={ref}>
      <button
        type="button"
        className="nb-btn"
        onClick={() => { setOpen(o => !o); setShowAll(false); }}
        aria-label="Thông báo"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="nb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="nb-dropdown">
          <div className="nb-header">
            <h4>🔔 Thông Báo</h4>
            <div className="nb-header-right">
              {unreadCount > 0 && (
                <span className="nb-unread-count">{unreadCount} chưa đọc</span>
              )}
              {notifs.length > 0 && (
                <button
                  className="nb-mark-all"
                  onMouseDown={e => { e.stopPropagation(); e.preventDefault(); }}
                  onClick={e => { e.stopPropagation(); markAllRead(); }}
                >
                  <Check size={13} /> Đọc tất cả
                </button>
              )}
            </div>
          </div>

          <div className="nb-list">
            {notifs.length === 0 ? (
              <div className="nb-empty">
                <Bell size={32} style={{ opacity: 0.2 }} />
                <p>Chưa có thông báo</p>
              </div>
            ) : (
              <>
                {visibleNotifs.map(n => {
                  const isUnread = new Date(n.createdAt) > lastSeen;
                  const tc = TYPE_COLORS[n.type] || { bg: 'rgba(255,255,255,0.1)', color: '#94a3b8' };
                  return (
                    <div
                      key={n.id}
                      className={`nb-item ${isUnread ? 'nb-unread' : ''}`}
                      onClick={() => {
                        markAllRead();
                        setOpen(false);
                        if (n.link) navigate(n.link);
                      }}
                    >
                      {isUnread && <div className="nb-dot" />}
                      <div className="nb-icon" style={{ background: tc.bg, color: tc.color }}>
                        {n.type === 'ORDER' ? <ShoppingBag size={16} />
                          : n.type === 'REPLY' ? <MessageSquare size={16} />
                          : ICON_MAP[n.icon] || <Bell size={16} />}
                      </div>
                      <div className="nb-content">
                        <p className="nb-msg">{n.message}</p>
                        {n.detail && <p className="nb-detail">{n.detail}</p>}
                        <p className="nb-time">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}

                {hasMore && (
                  <button
                    className="nb-show-more"
                    onClick={e => { e.stopPropagation(); setShowAll(v => !v); }}
                  >
                    {showAll
                      ? `Thu gọn ▲`
                      : `Xem thêm ${notifs.length - MAX_VISIBLE} thông báo ▼`}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="nb-footer">
            <span>{notifs.length} thông báo</span>
          </div>
        </div>
      )}
    </div>
  );
}
