import { useState, useEffect } from 'react';
import { ClipboardList, Eye, CheckCircle, Clock, Trash2, Phone, User, BookOpen, Award, Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Loading from '../components/Loading';

const STATUS_MAP = {
  pending: { label: 'Chờ xử lý', color: '#f59e0b', bg: '#f59e0b15' },
  contacted: { label: 'Đã liên hệ', color: '#3b82f6', bg: '#3b82f615' },
  completed: { label: 'Hoàn thành', color: '#10b981', bg: '#10b98115' },
};

export default function Registrations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const params = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (filter !== 'all') params.status = filter;
      const res = await api.get('/registrations/admin/all', { params });
      setData(res.data.data || []);
    } catch { toast.error('Lỗi tải dữ liệu'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filter, typeFilter]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/registrations/admin/${id}`, { status, isRead: true });
      toast.success('Đã cập nhật');
      fetchData();
    } catch { toast.error('Lỗi'); }
  };

  const deleteItem = async (id) => {
    try {
      await api.delete(`/registrations/admin/${id}`);
      toast.success('Đã xóa');
      setData(prev => prev.filter(d => d.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch { toast.error('Lỗi'); }
  };

  const filtered = data.filter(d =>
    d.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    d.phone?.includes(search)
  );

  const parseSafe = (str) => { try { return JSON.parse(str); } catch { return []; } };

  if (loading) return <Loading fullPage message="Đang tải..." />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Quản Lý Ghi Danh</h1>
          <p className="subtitle">{data.length} đăng ký • {data.filter(d => d.status === 'pending').length} chờ xử lý</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', maxWidth: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Tìm theo tên, SĐT..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }} />
        </div>
        <select className="form-control" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">Tất cả loại</option>
          <option value="course">Đăng ký học</option>
          <option value="exam">Đăng ký thi</option>
        </select>
        <select className="form-control" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="contacted">Đã liên hệ</option>
          <option value="completed">Hoàn thành</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '16px' }}>
        {/* List */}
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>SĐT</th>
                  <th>Loại</th>
                  <th>Trạng thái</th>
                  <th>Ngày</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} style={{
                    cursor: 'pointer',
                    background: selected?.id === item.id ? 'var(--bg-subtle)' : item.isRead ? 'transparent' : 'rgba(99,102,241,0.03)',
                  }} onClick={() => setSelected(item)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!item.isRead && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />}
                        <strong>{item.fullName}</strong>
                      </div>
                    </td>
                    <td>{item.phone}</td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700,
                        background: item.type === 'course' ? '#6366f115' : '#f59e0b15',
                        color: item.type === 'course' ? '#6366f1' : '#f59e0b',
                      }}>
                        {item.type === 'course' ? 'Học' : 'Thi'}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 600,
                        background: STATUS_MAP[item.status]?.bg, color: STATUS_MAP[item.status]?.color,
                      }}>{STATUS_MAP[item.status]?.label}</span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); deleteItem(item.id); }}
                        style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Chưa có đăng ký nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><Eye size={16} /> Chi Tiết Đăng Ký</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Họ tên</label>
                  <p style={{ margin: '2px 0', fontWeight: 700 }}>{selected.fullName}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>SĐT</label>
                  <p style={{ margin: '2px 0', fontWeight: 700 }}>{selected.phone}</p>
                </div>
              </div>

              {selected.type === 'course' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Khóa học đăng ký</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {parseSafe(selected.courses).map((c, i) => (
                        <span key={i} style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', background: 'var(--primary)', color: '#fff', fontWeight: 600 }}>{c}</span>
                      ))}
                    </div>
                  </div>
                  {selected.level && (
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Mức độ</label>
                      <p style={{ margin: '2px 0' }}>{selected.level}</p>
                    </div>
                  )}
                  {selected.schedule && (
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Khung giờ</label>
                      <p style={{ margin: '2px 0' }}>{selected.schedule}</p>
                    </div>
                  )}
                </>
              )}

              {selected.type === 'exam' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ngày sinh</label>
                      <p style={{ margin: '2px 0' }}>{selected.birthDate || '—'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>CCCD</label>
                      <p style={{ margin: '2px 0' }}>{selected.idNumber || '—'}</p>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Chứng chỉ thi</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                      {parseSafe(selected.examType).map((e, i) => {
                        const examId = e.id || e;
                        const lang = e.lang;
                        const ver = e.ver;
                        return (
                          <div key={i} style={{
                            padding: '8px 12px', borderRadius: '8px',
                            background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                          }}>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: lang || ver ? '4px' : 0 }}>
                              {examId.toUpperCase()}
                            </div>
                            {(lang || ver) && (
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {lang && (
                                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600, background: '#3b82f615', color: '#3b82f6' }}>
                                    🌐 {lang}
                                  </span>
                                )}
                                {ver && (
                                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600, background: '#10b98115', color: '#10b981' }}>
                                    📦 {ver}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {selected.note && (
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ghi chú</label>
                  <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>{selected.note}</p>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Cập nhật trạng thái</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {Object.entries(STATUS_MAP).map(([key, val]) => (
                    <button key={key} className={`btn btn-sm ${selected.status === key ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => updateStatus(selected.id, key)}
                      style={selected.status === key ? { background: val.color, borderColor: val.color } : {}}>
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
