import { useState, useEffect } from 'react';
import { User, Mail, Phone, Camera, Save, Lock, LayoutDashboard } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone:    user?.phone    || '',
    avatar:   user?.avatar   || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  // Đồng bộ dữ liệu mới nhất từ server mỗi khi vào trang
  useEffect(() => {
    api.get('/auth/me').then(res => {
      const fresh = res.data.data;
      updateUser(fresh); // sync authStore
      setForm({ fullName: fresh.fullName || '', phone: fresh.phone || '', avatar: fresh.avatar || '' });
    }).catch(() => {}); // silent fail nếu chưa login
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', form);
      updateUser(res.data.data);
      toast.success('Cập nhật thông tin thành công!');
    } catch {
      toast.error('Lỗi khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('Mật khẩu xác nhận không khớp');
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Đổi mật khẩu thành công!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post('/upload/user-image', formData);
      const avatarUrl = res.data.data.url;
      setForm({ ...form, avatar: avatarUrl });
      // Auto-save avatar to backend & sync with navbar
      const profileRes = await api.put('/auth/profile', { 
        fullName: form.fullName, phone: form.phone, avatar: avatarUrl 
      });
      updateUser(profileRes.data.data);
      toast.success('Đã cập nhật ảnh đại diện!');
    } catch {
      toast.error('Lỗi khi tải ảnh');
    }
  };

  const adminHref = import.meta.env.VITE_ADMIN_URL || (import.meta.env.PROD ? '/admin' : 'http://localhost:5174');
  const adminLinkExternal = !adminHref.startsWith('/');

  return (
    <div className="profile-page">
      <div className="container profile-container">
        <div className="profile-card">
          <div className="profile-sidebar">
            <div className="avatar-section">
              <div className="avatar-wrapper">
                {form.avatar ? (
                  <img src={form.avatar.startsWith('http') ? form.avatar : `${import.meta.env.VITE_API_URL?.replace('/api','')}${form.avatar}`} alt="Avatar" />
                ) : (
                  <div className="avatar-placeholder">{form.fullName?.[0] || 'U'}</div>
                )}
                <label className="avatar-edit">
                  <Camera size={16} />
                  <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
                </label>
              </div>
              <h3>{user?.fullName}</h3>
              <p>{user?.email}</p>
            </div>
            <nav className="profile-nav">
              <button 
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} /> Thông tin cá nhân
              </button>
              <button 
                className={`nav-item ${activeTab === 'password' ? 'active' : ''}`}
                onClick={() => setActiveTab('password')}
              >
                <Lock size={18} /> Đổi mật khẩu
              </button>
              {user?.role === 'admin' && (
                <a
                  href={adminHref}
                  className="nav-item"
                  {...(adminLinkExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
                >
                  <LayoutDashboard size={18} /> Admin Dashboard
                </a>
              )}
            </nav>
          </div>

          <div className="profile-content">
            {activeTab === 'profile' ? (
              <>
                <h2 className="content-title">Cài Đặt <span className="highlight">Tài Khoản</span></h2>
                <form onSubmit={handleUpdate}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label><User size={14} /> Họ và Tên</label>
                      <input 
                        type="text" className="form-control" 
                        value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} 
                      />
                    </div>
                    <div className="form-group">
                      <label><Mail size={14} /> Email (Không thể đổi)</label>
                      <input type="email" className="form-control" value={user?.email} disabled />
                    </div>
                    <div className="form-group">
                      <label><Phone size={14} /> Số điện thoại</label>
                      <input 
                        type="text" className="form-control" 
                        value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      <Save size={18} /> {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 className="content-title">Đổi <span className="highlight">Mật Khẩu</span></h2>
                <form onSubmit={handlePasswordUpdate}>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="form-group">
                      <label><Lock size={14} /> Mật khẩu hiện tại</label>
                      <input 
                        type="password" required className="form-control" 
                        value={passwordForm.currentPassword} 
                        onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} 
                      />
                    </div>
                    <div className="form-group">
                      <label><Lock size={14} /> Mật khẩu mới</label>
                      <input 
                        type="password" required className="form-control" placeholder="Ít nhất 8 ký tự"
                        value={passwordForm.newPassword} 
                        onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                      />
                    </div>
                    <div className="form-group">
                      <label><Lock size={14} /> Xác nhận mật khẩu mới</label>
                      <input 
                        type="password" required className="form-control" placeholder="Nhập lại mật khẩu mới"
                        value={passwordForm.confirmPassword} 
                        onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      <Save size={18} /> {loading ? 'Đang lưu...' : 'Đổi Mật Khẩu'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
