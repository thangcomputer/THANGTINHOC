import { useState, useEffect } from 'react';
import { Search, ShieldAlert, CheckCircle, XCircle, X, Edit, Trash2, Key, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { useConfirm } from '../components/ConfirmProvider';
import { useFocusTrap } from '../hooks/useFocusTrap';

const emptyCreate = { fullName: '', email: '', phone: '', password: '', role: 'user' };

export default function UserList() {
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [editingUser, setEditingUser] = useState(null);
  const [resettingUser, setResettingUser] = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [creating, setCreating] = useState(false);
  const editTrapRef = useFocusTrap(!!editingUser);
  const createTrapRef = useFocusTrap(!!creatingUser);
  const resetTrapRef = useFocusTrap(!!resettingUser);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter]);

  useEffect(() => {
    setLoading(true);
    api.get('/users', {
      params: {
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
      },
    }).then(res => {
      setUsers(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, totalPages: 1 });
    }).finally(() => setLoading(false));
  }, [page, roleFilter, debouncedSearch]);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users', {
      params: {
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
      },
    }).then(res => {
      setUsers(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, totalPages: 1 });
    }).finally(() => setLoading(false));
  };

  const toggleStatus = async (id) => {
    try {
      const res = await api.put(`/users/${id}/status`);
      setUsers(users.map(u => u.id === id ? { ...u, isActive: res.data.data.isActive } : u));
      toast.success(res.data.data.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
    } catch { toast.error('Lỗi khi cập nhật trạng thái'); }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Xóa người dùng',
      message: 'Tài khoản và dữ liệu liên quan sẽ bị xóa. Tiếp tục?',
      danger: true,
      confirmLabel: 'Xóa',
    });
    if (!ok) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Đã xóa người dùng');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Không thể xóa'); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${editingUser.id}`, {
        email: editingUser.email,
        fullName: editingUser.fullName,
        phone: editingUser.phone,
        role: editingUser.role,
      });
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editingUser } : u));
      toast.success('Cập nhật thành công');
      setEditingUser(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi khi cập nhật'); }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/users/${resettingUser.id}/reset-password`, { newPassword: resettingUser.newPassword });
      toast.success('Đã đặt lại mật khẩu');
      setResettingUser(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (createForm.password.length < 6) return toast.error('Mật khẩu tối thiểu 6 ký tự');
    setCreating(true);
    try {
      const res = await api.post('/users', createForm);
      toast.success('Đã tạo người dùng thành công');
      setCreatingUser(false);
      setCreateForm(emptyCreate);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo người dùng');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Quản lý người dùng</h1>
          <p>{pagination.total} thành viên trên hệ thống</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => { setCreatingUser(true); setCreateForm(emptyCreate); }}
        >
          <UserPlus size={18} /> Tạo Người Dùng
        </button>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div className="search-input-wrap" style={{ flex: '1 1 220px' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text" className="form-control" placeholder="Tìm kiếm tài khoản..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="search-clear-btn" onClick={() => setSearch('')}><X size={14} /></button>
            )}
          </div>
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '140px' }}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="">Tất cả vai trò</option>
            <option value="user">Học viên</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="table-wrap responsive-table">
          <table>
            <thead>
              <tr>
                <th>Họ Tên</th>
                <th>Email / SĐT</th>
                <th>Vai Trò</th>
                <th>Trạng Thái</th>
                <th>Đăng Ký</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6"><Loading /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="6"><EmptyState title="Không có người dùng" message="Thử đổi từ khóa hoặc bộ lọc." actionLabel="Tạo người dùng" onAction={() => { setCreatingUser(true); setCreateForm(emptyCreate); }} /></td></tr>
              ) : users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: 'var(--radius-sm)',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-400) 100%)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                      }}>
                        {user.fullName?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{user.fullName}</span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontSize: '0.875rem' }}>{user.email}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user.phone || 'Chưa cập nhật'}</div>
                    </div>
                  </td>
                  <td>
                    {user.role === 'admin'
                      ? <span className="badge badge-primary"><ShieldAlert size={11} /> Admin</span>
                      : <span className="badge badge-secondary">Học viên</span>}
                  </td>
                  <td>
                    {user.isActive
                      ? <span className="status-pill pill-success">Hoạt động</span>
                      : <span className="status-pill pill-danger">Bị khóa</span>}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" onClick={() => setEditingUser({ ...user })} className="btn btn-secondary btn-sm btn-icon" title="Sửa">
                        <Edit size={14} style={{ color: 'var(--primary)' }} />
                      </button>
                      <button type="button" onClick={() => setResettingUser({ ...user, newPassword: '' })} className="btn btn-secondary btn-sm btn-icon" title="Đặt lại mật khẩu">
                        <Key size={14} style={{ color: 'var(--warning)' }} />
                      </button>
                      <button type="button" onClick={() => toggleStatus(user.id)} className="btn btn-secondary btn-sm btn-icon" title={user.isActive ? 'Khóa' : 'Mở khóa'}>
                        {user.isActive ? <XCircle size={14} style={{ color: 'var(--danger)' }} /> : <CheckCircle size={14} style={{ color: 'var(--success)' }} />}
                      </button>
                      <button type="button" onClick={() => handleDelete(user.id)} className="btn btn-secondary btn-sm btn-icon" title="Xóa" style={{ color: 'var(--danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={pagination.totalPages || 1}
          total={pagination.total || 0}
          onPageChange={setPage}
        />
      </div>

      {/* Create User Modal */}
      {creatingUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }} ref={createTrapRef}>
            <div className="modal-header">
              <h2><UserPlus size={18} /> Tạo người dùng mới</h2>
              <button type="button" onClick={() => setCreatingUser(false)} className="btn btn-secondary btn-icon btn-sm"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="modal-form">
              <div className="form-group">
                <label>Họ và Tên *</label>
                <input type="text" className="form-control" required
                  value={createForm.fullName} onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" className="form-control" required
                  value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input type="text" className="form-control"
                  value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Mật Khẩu * (tối thiểu 6 ký tự)</label>
                <input type="password" className="form-control" required minLength={6}
                  value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Vai Trò</label>
                <select className="form-control" value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
                  <option value="user">Học viên</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCreatingUser(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Đang tạo...' : 'Tạo Người Dùng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content" ref={editTrapRef}>
            <div className="modal-header">
              <h2>Sửa thông tin</h2>
              <button type="button" onClick={() => setEditingUser(null)} className="btn btn-secondary btn-icon btn-sm"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label>Họ và Tên</label>
                <input type="text" className="form-control" value={editingUser.fullName}
                  onChange={e => setEditingUser({ ...editingUser, fullName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-control" value={editingUser.email}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input type="text" className="form-control" value={editingUser.phone || ''}
                  onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Vai Trò</label>
                <select className="form-control" value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                  <option value="user">Học viên</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu Thay Đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }} ref={resetTrapRef}>
            <div className="modal-header">
              <h2>Đặt lại mật khẩu</h2>
              <button type="button" onClick={() => setResettingUser(null)} className="btn btn-secondary btn-icon btn-sm"><X size={18} /></button>
            </div>
            <form onSubmit={handleResetSubmit} className="modal-form">
              <p style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Đặt mật khẩu mới cho <strong style={{ color: 'var(--text-primary)' }}>{resettingUser.email}</strong>
              </p>
              <div className="form-group">
                <label>Mật Khẩu Mới</label>
                <input type="password" minLength={6} className="form-control" placeholder="Tối thiểu 6 ký tự"
                  value={resettingUser.newPassword} onChange={e => setResettingUser({ ...resettingUser, newPassword: e.target.value })} required />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setResettingUser(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu Mật Khẩu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
