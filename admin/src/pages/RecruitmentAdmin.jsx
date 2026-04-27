import { useState, useEffect } from 'react';
import { Briefcase, Eye, Trash2, Search, Phone, Mail, MapPin, Award, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Loading from '../components/Loading';

const STATUS_MAP = {
  pending: { label: 'Chờ duyệt', color: '#f59e0b', bg: '#f59e0b15' },
  reviewing: { label: 'Đang xem', color: '#3b82f6', bg: '#3b82f615' },
  accepted: { label: 'Đã nhận', color: '#10b981', bg: '#10b98115' },
  rejected: { label: 'Từ chối', color: '#ef4444', bg: '#ef444415' },
};

const EXPERTISE_LABELS = {
  'tin-hoc-van-phong': 'Tin học VP',
  'ai': 'AI',
  'photoshop': 'Photoshop',
  'corel': 'CorelDRAW',
  'autocad': 'AutoCAD',
  'other': 'Khác',
};

const SCHEDULE_LABELS = {
  'sang': '🌅 Sáng',
  'trua': '☀️ Trưa',
  'chieu': '🌤️ Chiều',
  'toi': '🌙 Tối',
};

const DEGREE_LABELS = {
  'trung-cap': 'Trung cấp',
  'cao-dang': 'Cao đẳng',
  'dai-hoc': 'Đại học',
  'thac-si': 'Thạc sĩ',
  'tien-si': 'Tiến sĩ',
  'chung-chi': 'Chứng chỉ nghề',
};

export default function RecruitmentAdmin() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      const res = await api.get('/recruitment/admin/all', { params });
      setData(res.data.data || []);
    } catch { toast.error('Lỗi tải dữ liệu'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/recruitment/admin/${id}`, { status, isRead: true });
      toast.success('Đã cập nhật');
      fetchData();
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
    } catch { toast.error('Lỗi'); }
  };

  const deleteItem = async (id) => {
    try {
      await api.delete(`/recruitment/admin/${id}`);
      toast.success('Đã xóa');
      setData(prev => prev.filter(d => d.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch { toast.error('Lỗi'); }
  };

  const filtered = data.filter(d =>
    d.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    d.phone?.includes(search) || d.email?.toLowerCase().includes(search.toLowerCase())
  );

  const parseSafe = (str) => { try { return JSON.parse(str); } catch { return []; } };

  if (loading) return <Loading fullPage message="Đang tải..." />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Quản Lý Tuyển Dụng</h1>
          <p className="subtitle">{data.length} ứng viên • {data.filter(d => d.status === 'pending').length} chờ duyệt</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', maxWidth: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Tìm theo tên, SĐT, email..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }} />
        </div>
        <select className="form-control" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ duyệt</option>
          <option value="reviewing">Đang xem</option>
          <option value="accepted">Đã nhận</option>
          <option value="rejected">Từ chối</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.2fr' : '1fr', gap: '16px' }}>
        {/* List */}
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>SĐT / Email</th>
                  <th>Chuyên môn</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const expertise = parseSafe(item.expertise);
                  return (
                    <tr key={item.id} style={{
                      cursor: 'pointer',
                      background: selected?.id === item.id ? 'var(--bg-subtle)' : item.isRead ? 'transparent' : 'rgba(99,102,241,0.03)',
                    }} onClick={() => setSelected(item)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {!item.isRead && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />}
                          <div>
                            <strong>{item.fullName}</strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {DEGREE_LABELS[item.degree] || item.degree}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem' }}>{item.phone}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.email}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                          {expertise.slice(0, 2).map((e, i) => (
                            <span key={i} style={{
                              padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600,
                              background: 'var(--primary)', color: '#fff',
                            }}>{EXPERTISE_LABELS[e] || e}</span>
                          ))}
                          {expertise.length > 2 && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{expertise.length - 2}</span>}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 600,
                          background: STATUS_MAP[item.status]?.bg, color: STATUS_MAP[item.status]?.color,
                        }}>{STATUS_MAP[item.status]?.label}</span>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); deleteItem(item.id); }}
                          style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Chưa có ứng viên nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><Eye size={16} /> Hồ Sơ Ứng Viên</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Personal */}
              <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Briefcase size={14} /> Thông Tin Cá Nhân
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Họ tên</label>
                    <p style={{ margin: '2px 0', fontWeight: 700, fontSize: '0.9rem' }}>{selected.fullName}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tuổi</label>
                    <p style={{ margin: '2px 0', fontSize: '0.9rem' }}>{selected.age || '—'}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}><Phone size={10} /> SĐT</label>
                    <p style={{ margin: '2px 0', fontSize: '0.9rem' }}>{selected.phone}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}><Mail size={10} /> Email</label>
                    <p style={{ margin: '2px 0', fontSize: '0.9rem' }}>{selected.email}</p>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}><MapPin size={10} /> Quê quán</label>
                    <p style={{ margin: '2px 0', fontSize: '0.9rem' }}>{selected.hometown || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Professional */}
              <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={14} /> Trình Độ & Kinh Nghiệm
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Bằng cấp</label>
                    <p style={{ margin: '2px 0', fontWeight: 600 }}>{DEGREE_LABELS[selected.degree] || selected.degree}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Hình thức dạy</label>
                    <p style={{ margin: '2px 0' }}>
                      {selected.teachMode === 'online' ? 'Online' : selected.teachMode === 'offline' ? 'Offline' : 'Online & Offline'}
                    </p>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Kinh nghiệm</label>
                    <p style={{ margin: '2px 0', fontSize: '0.85rem', lineHeight: 1.5 }}>{selected.experience || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Expertise */}
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Chuyên môn</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {parseSafe(selected.expertise).map((e, i) => (
                    <span key={i} style={{
                      padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600,
                      background: 'var(--primary)', color: '#fff',
                    }}>{EXPERTISE_LABELS[e] || e}</span>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Thời gian dạy</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {parseSafe(selected.schedule).map((s, i) => (
                    <span key={i} style={{
                      padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
                      background: '#8b5cf620', color: '#8b5cf6',
                    }}>{SCHEDULE_LABELS[s] || s}</span>
                  ))}
                </div>
              </div>

              {selected.note && (
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ghi chú</label>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', lineHeight: 1.5 }}>{selected.note}</p>
                </div>
              )}

              {/* Status Actions */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Cập nhật trạng thái</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.entries(STATUS_MAP).map(([key, val]) => (
                    <button key={key} className={`btn btn-sm ${selected.status === key ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => updateStatus(selected.id, key)}
                      style={selected.status === key ? { background: val.color, borderColor: val.color } : {}}>
                      {key === 'accepted' && <CheckCircle size={12} />}
                      {key === 'rejected' && <XCircle size={12} />}
                      {key === 'reviewing' && <AlertCircle size={12} />}
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                Ngày nộp: {new Date(selected.createdAt).toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
