import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Folder, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

const slugify = (text) => {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', type: 'course', description: '' });

  const fetchCategories = () => {
    setLoading(true);
    api.get('/categories').then(res => setCategories(res.data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, form);
        toast.success('Cập nhật danh mục thành công');
      } else {
        await api.post('/categories', form);
        toast.success('Thêm danh mục mới thành công');
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      setForm({ name: '', slug: '', type: 'course', description: '' });
      fetchCategories();
    } catch { toast.error('Lỗi khi lưu danh mục'); }
  };

  const handleDelete = async (id) => {
    // Directly delete category without confirmation dialog
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Đã xóa danh mục');
      fetchCategories();
    } catch {
      toast.error('Danh mục đang chứa bài viết/khóa học, không thể xóa.');
    }
  };

  const openForm = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setForm({ ...cat });
    } else {
      setEditingCategory(null);
      setForm({ name: '', slug: '', type: 'course', description: '' });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Quản Lý Danh Mục</h1>
          <p>Phân loại cho Khóa học và Bài viết Blog</p>
        </div>
        <button className="btn btn-primary" onClick={() => openForm()}>
          <Plus size={18} /> Thêm Danh Mục
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tên Danh Mục</th>
                <th>Slug</th>
                <th>Loại</th>
                <th>Số Lượng</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5"><Loading /></td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan="5"><EmptyState message="Chưa có danh mục nào" /></td></tr>
              ) : categories.map(cat => (
                <tr key={cat.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: cat.type === 'course' ? 'var(--primary-100)' : 'var(--success-bg)',
                        color: cat.type === 'course' ? 'var(--primary)' : 'var(--success)',
                        flexShrink: 0,
                      }}>
                        {cat.type === 'course' ? <Folder size={16} /> : <FileText size={16} />}
                      </div>
                      <span style={{ fontWeight: 600 }}>{cat.name}</span>
                    </div>
                  </td>
                  <td><code style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: '4px' }}>{cat.slug}</code></td>
                  <td>
                    <span className={`badge ${cat.type === 'course' ? 'badge-primary' : 'badge-success'}`}>
                      {cat.type === 'course' ? 'Khóa học' : 'Bài viết'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{cat.type === 'course' ? cat._count?.courses : cat._count?.posts}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openForm(cat)} title="Sửa">
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-secondary btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(cat.id)} title="Xóa">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingCategory ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary btn-icon btn-sm"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>Tên Danh Mục</label>
                <input 
                  type="text" className="form-control" required value={form.name} 
                  onChange={e => {
                    const name = e.target.value;
                    setForm({ ...form, name, slug: editingCategory ? form.slug : slugify(name) });
                  }} 
                />
              </div>
              <div className="form-group">
                <label>Slug</label>
                <input type="text" className="form-control" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Loại Danh Mục</label>
                <select className="form-control" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="course">Khóa học</option>
                  <option value="post">Bài viết (Blog)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea className="form-control" rows="3" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu Danh Mục</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
