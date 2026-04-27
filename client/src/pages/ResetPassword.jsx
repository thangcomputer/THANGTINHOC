import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Save, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import './Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [siteLogo, setSiteLogo] = useState(null);
  const [siteName, setSiteName] = useState('Thắng Tin Học');

  useEffect(() => {
    api.get('/settings').then(res => {
      const s = res.data.data;
      if (s?.site_logo) setSiteLogo(s.site_logo);
      if (s?.site_name) setSiteName(s.site_name);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Mật khẩu nhập lại không khớp!');
    }
    if (password.length < 6) {
      return toast.error('Mật khẩu phải từ 6 ký tự trở lên');
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { email, token, newPassword: password });
      toast.success(res.data.message);
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Link khôi phục không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="auth-page">
        <div className="auth-bg">
          <div className="auth-orb orb1" />
          <div className="auth-orb orb2" />
        </div>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h2 className="auth-title">Liên Kết Không Hợp Lệ</h2>
          <p className="auth-subtitle">Không tìm thấy thông tin xác thực.</p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Yêu Cầu Lại</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb orb1" />
        <div className="auth-orb orb2" />
      </div>
      <div className="auth-card">
        <div className="auth-brand">
          {siteLogo ? (
            <img src={siteLogo} alt={siteName} style={{ height: '40px', objectFit: 'contain' }} />
          ) : (
            <div className="brand-icon"><BookOpen size={22} /></div>
          )}
          <span>{siteName}</span>
        </div>
        <h2 className="auth-title">Tạo Mật Khẩu Mới</h2>
        <p className="auth-subtitle">Vui lòng thiết lập mật khẩu mới cho tài khoản {email}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <Lock size={16} /> Mật Khẩu Mới
            </label>
            <input 
              type="password" 
              required 
              className="form-control" 
              placeholder="Nhập tối thiểu 6 ký tự"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>
              <Lock size={16} /> Nhập Lại Mật Khẩu Mới
            </label>
            <input 
              type="password" 
              required 
              className="form-control" 
              placeholder="Xác nhận lại mật khẩu"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '1rem', justifyContent: 'center' }} disabled={loading}>
            <Save size={18} /> {loading ? 'Đang Lưu...' : 'Xác Nhận'}
          </button>
        </form>
      </div>
    </div>
  );
}
