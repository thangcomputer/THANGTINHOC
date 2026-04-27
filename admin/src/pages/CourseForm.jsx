import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Loading from '../components/Loading';

const slugify = (text) => {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

export default function CourseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', slug: '', description: '', price: 0, originalPrice: 0, level: 'beginner',
    categoryId: '', thumbnail: '', isPublished: false, isFeatured: false,
    hasDocuments: true, hasLifetimeAccess: true, hasCertificate: true,
    lessons: []
  });

  useEffect(() => {
    api.get('/stats/categories?type=course').then(res => setCategories(res.data.data || []));
    if (id) {
      setLoading(true);
      api.get(`/courses/admin/${id}`).then(res => setForm(res.data.data)).finally(() => setLoading(false));
    }
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.categoryId) return toast.error('Vui lòng điền đầy đủ thông tin');
    setSaving(true);
    try {
      if (id) await api.put(`/courses/${id}`, form);
      else await api.post('/courses', form);
      toast.success('Lưu thành công');
      navigate('/courses');
    } catch { toast.error('Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post('/upload', formData);
      setForm(prev => ({ ...prev, thumbnail: res.data.data.url }));
      toast.success('Tải ảnh thành công');
    } catch { toast.error('Lỗi khi tải ảnh'); }
  };

  if (loading) return <Loading fullPage message="Đang tải khóa học..." />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <Link to="/courses" className="btn btn-secondary btn-sm" style={{ marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Quay Lại
          </Link>
          <h1>{id ? 'Chỉnh Sửa' : 'Thêm'} Khóa Học</h1>
        </div>
        <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
          {saving ? <><Loader2 size={16} className="spinner" /> Đang lưu...</> : <><Save size={18} /> Lưu Khóa Học</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Thông Tin Cơ Bản</h3></div>
            <div className="card-body">
              <div className="form-group">
                <label>Tiêu Đề Khóa Học *</label>
                <input 
                  type="text" className="form-control" value={form.title} 
                  placeholder="VD: Excel Nâng Cao - Từ Cơ Bản Đến Chuyên Nghiệp"
                  onChange={e => {
                    const title = e.target.value;
                    setForm({ ...form, title, slug: id ? form.slug : slugify(title) });
                  }} 
                />
              </div>
              <div className="form-group">
                <label>Slug (URL thân thiện)</label>
                <input type="text" className="form-control" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div className="form-group">
                <label>📝 Mô Tả Ngắn <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(hiển thị ở phần giới thiệu trên cùng)</span></label>
                <textarea className="form-control" rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Khóa học PowerPoint cơ bản đến nâng cao giúp học viên nắm vững toàn bộ kỹ năng..." />
              </div>
              <div className="form-group">
                <label>📄 Mô Tả Chi Tiết <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(mỗi dòng = 1 mục, tự thêm • đầu dòng, hiển thị ở tab "Mô Tả")</span></label>
                <textarea className="form-control" rows="5" value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} placeholder={"Học viên sẽ được hướng dẫn cách tạo slide chuyên nghiệp\nThiết kế đẹp với màu sắc, font chữ phù hợp\nChèn hình ảnh, video, âm thanh, animation\nThực hành qua các bài tập thực tế"} />
                {form.content && (
                  <div style={{ marginTop: '8px', padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.82rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>XEM TRƯỚC:</span>
                    {form.content.split('\n').filter(l => l.trim()).map((line, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '3px 0', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1 }}>•</span>
                        <span>{line.trim()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>📋 Yêu Cầu Khóa Học <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(mỗi dòng = 1 yêu cầu, tự thêm ✅)</span></label>
                <textarea
                  className="form-control" rows="4"
                  placeholder={"Có máy tính cá nhân\nBiết sử dụng Word cơ bản\nKết nối Internet ổn định"}
                  value={(() => { try { return JSON.parse(form.requirements || '[]').join('\n'); } catch { return form.requirements || ''; } })()}
                  onChange={e => {
                    const lines = e.target.value.split('\n').filter(l => l.trim());
                    setForm({ ...form, requirements: JSON.stringify(lines) });
                  }}
                />
                {(() => {
                  let reqs = [];
                  try { reqs = JSON.parse(form.requirements || '[]'); } catch {}
                  return reqs.length > 0 ? (
                    <div style={{ marginTop: '8px', padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.82rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>XEM TRƯỚC:</span>
                      {reqs.map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '3px 0', color: 'var(--text-secondary)' }}>
                          <span style={{ color: '#10b981', fontSize: '0.9rem' }}>✅</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="card-title">Giá & Học Phí</h3></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Giá Bán (VNĐ)</label>
                  <input type="number" className="form-control" value={form.price} onChange={e => setForm({ ...form, price: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                  <label>Giá Gốc (VNĐ)</label>
                  <input type="number" className="form-control" value={form.originalPrice || ''} onChange={e => setForm({ ...form, originalPrice: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              {form.originalPrice > form.price && form.price > 0 && (
                <div style={{ 
                  padding: '10px 14px', background: 'var(--success-bg)', 
                  borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                  color: 'var(--success-text)', fontWeight: 600,
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}>
                  Giảm giá: {Math.round((1 - form.price / form.originalPrice) * 100)}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Phân Loại</h3></div>
            <div className="card-body">
              <div className="form-group">
                <label>Danh Mục *</label>
                <select className="form-control" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">Chọn danh mục</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Cấp Độ</label>
                <select className="form-control" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                  <option value="beginner">Cơ Bản</option>
                  <option value="intermediate">Trung Cấp</option>
                  <option value="advanced">Nâng Cao</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="isPublished" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} />
                  <label htmlFor="isPublished" style={{ marginBottom: 0 }}>Công khai khóa học</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="isFeatured" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} />
                  <label htmlFor="isFeatured" style={{ marginBottom: 0 }}>Khóa học nổi bật</label>
                </div>
              </div>
            </div>
          </div>

          {/* Khóa học bao gồm */}
          <div className="card">
            <div className="card-header"><h3 className="card-title">📦 Khóa Học Bao Gồm</h3></div>
            <div className="card-body">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Bật/tắt các tính năng hiển thị trên trang chi tiết khóa học. Số bài học video và thời lượng được tự động tính từ danh sách bài học.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="hasDocuments" checked={form.hasDocuments !== false} onChange={e => setForm({ ...form, hasDocuments: e.target.checked })} />
                  <label htmlFor="hasDocuments" style={{ marginBottom: 0 }}>📄 Tài liệu đính kèm</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="hasLifetimeAccess" checked={form.hasLifetimeAccess !== false} onChange={e => setForm({ ...form, hasLifetimeAccess: e.target.checked })} />
                  <label htmlFor="hasLifetimeAccess" style={{ marginBottom: 0 }}>♾️ Truy cập trọn đời</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="hasCertificate" checked={form.hasCertificate !== false} onChange={e => setForm({ ...form, hasCertificate: e.target.checked })} />
                  <label htmlFor="hasCertificate" style={{ marginBottom: 0 }}>🏆 Chứng nhận hoàn thành</label>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="card-title">Ảnh Đại Diện</h3></div>
            <div className="card-body">
              <div style={{ 
                padding: '24px', 
                border: '2px dashed var(--border)', 
                textAlign: 'center', 
                borderRadius: 'var(--radius)', 
                position: 'relative',
                background: 'var(--bg-subtle)',
                transition: 'border-color 0.2s ease',
                minHeight: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {form.thumbnail ? (
                  <>
                    <img src={form.thumbnail} alt="" style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
                    <button 
                      type="button"
                      onClick={() => setForm({ ...form, thumbnail: '' })} 
                      style={{ 
                        position: 'absolute', top: '8px', right: '8px', 
                        background: 'var(--danger)', color: 'white', 
                        border: 'none', borderRadius: '50%', 
                        width: '28px', height: '28px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Upload size={28} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nhấn để tải ảnh lên</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.7 }}>PNG, JPG tối đa 5MB</span>
                    <input type="file" hidden accept="image/*,.webp" onChange={handleUpload} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
