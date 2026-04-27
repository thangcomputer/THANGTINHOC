import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Eye, Phone, Search, CheckCircle, RefreshCcw } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

const STATUS_MAP = {
  new:      { label: 'Mới',       color: '#6366f1', bg: '#6366f115' },
  read:     { label: 'Đã xem',    color: '#10b981', bg: '#10b98115' },
  resolved: { label: 'Đã xử lý', color: '#94a3b8', bg: '#94a3b815' },
};

export default function Inquiries() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [selected, setSelected] = useState(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/contacts');
      setMessages(res.data.data || []);
    } catch {
      toast.error('Lỗi khi tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const markAsRead = async (msg) => {
    if (msg.isRead) return;
    try {
      await api.patch(`/contacts/${msg.id}/read`);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
      setSelected(prev => prev?.id === msg.id ? { ...prev, isRead: true } : prev);
    } catch { /* silent */ }
  };

  const deleteMessage = async (id) => {
    if (!confirm('Xóa tin nhắn này?')) return;
    try {
      await api.delete(`/contacts/${id}`);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success('Đã xóa tin nhắn');
    } catch {
      toast.error('Lỗi khi xóa');
    }
  };

  const handleSelect = (msg) => {
    setSelected(msg);
    markAsRead(msg);
  };

  const filtered = messages.filter(m => {
    const matchSearch =
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.phone?.includes(search) ||
      m.content?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'new' && !m.isRead) ||
      (filter === 'read' && m.isRead);
    return matchSearch && matchFilter;
  });

  const unreadCount = messages.filter(m => !m.isRead).length;

  if (loading && messages.length === 0) return <Loading fullPage message="Đang tải tin nhắn..." />;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Tin Nhắn Tư Vấn</h1>
          <p className="subtitle">
            {messages.length} tin nhắn
            {unreadCount > 0 && <span style={{ color: '#6366f1', fontWeight: 700 }}> • {unreadCount} chưa đọc</span>}
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchMessages}>
          <RefreshCcw size={15} /> Làm mới
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', maxWidth: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Tìm theo tên, SĐT..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }} />
        </div>
        <select className="form-control" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">Tất cả</option>
          <option value="new">Chưa đọc</option>
          <option value="read">Đã đọc</option>
        </select>
      </div>

      {/* Split Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '16px' }}>

        {/* List */}
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>SĐT</th>
                  <th>Nội dung</th>
                  <th>Trạng thái</th>
                  <th>Ngày gửi</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id}
                    style={{
                      cursor: 'pointer',
                      background: selected?.id === m.id
                        ? 'var(--bg-subtle)'
                        : !m.isRead ? 'rgba(99,102,241,0.04)' : 'transparent',
                    }}
                    onClick={() => handleSelect(m)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!m.isRead && (
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
                        )}
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '50%',
                          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.78rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                        }}>
                          {(m.name?.[0] || 'K').toUpperCase()}
                        </div>
                        <strong style={{ fontWeight: m.isRead ? 500 : 700 }}>{m.name || 'Khách vãng lai'}</strong>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>{m.phone}</td>
                    <td style={{ maxWidth: '200px' }}>
                      <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0, fontSize: '0.82rem', opacity: 0.75 }}>
                        {m.content}
                      </p>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700,
                        background: m.isRead ? '#10b98115' : '#6366f115',
                        color: m.isRead ? '#10b981' : '#6366f1',
                      }}>
                        {m.isRead ? 'Đã xem' : 'Mới'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(m.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm"
                        onClick={e => { e.stopPropagation(); deleteMessage(m.id); }}
                        style={{ color: 'var(--danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <MessageSquare size={36} style={{ opacity: 0.2, display: 'block', margin: '0 auto 8px' }} />
                      Không có tin nhắn nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><Eye size={16} /> Chi Tiết Tin Nhắn</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Khách hàng + SĐT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Họ tên</label>
                  <p style={{ margin: '3px 0', fontWeight: 700, fontSize: '1rem' }}>{selected.name || 'Khách vãng lai'}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Số điện thoại</label>
                  <p style={{ margin: '3px 0', fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>{selected.phone}</p>
                </div>
              </div>

              {/* Email nếu có */}
              {selected.email && (
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>✉️ Email</label>
                  <p style={{ margin: '3px 0', fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary)' }}>{selected.email}</p>
                </div>
              )}

              {/* Chủ đề nếu có */}
              {selected.subject && (
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>🏷️ Chủ đề</label>
                  <p style={{ margin: '3px 0' }}>
                    <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '99px', fontSize: '0.82rem', fontWeight: 600, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
                      {selected.subject}
                    </span>
                  </p>
                </div>
              )}

              {/* Nội dung yêu cầu */}
              <div style={{ background: 'var(--bg-subtle)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  💬 Nội dung yêu cầu
                </label>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.65', fontSize: '0.9rem', margin: 0 }}>
                  {selected.content}
                </p>
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>📅 {new Date(selected.createdAt).toLocaleString('vi-VN')}</span>
                {selected.isRead && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                    <CheckCircle size={13} /> Đã xem
                  </span>
                )}
              </div>

              {/* Action */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                <a href={`tel:${selected.phone}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <Phone size={16} /> Gọi Lại Tư Vấn
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
