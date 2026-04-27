import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, BookOpen, Mail, Lock, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import './Auth.css';

import { GoogleLogin } from '@react-oauth/google';

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
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
    if (form.password !== form.confirmPassword) {
      return toast.error('Mật khẩu xác nhận không khớp');
    }
    if (form.password.length < 6) {
      return toast.error('Mật khẩu phải có ít nhất 6 ký tự');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { email: form.email, password: form.password, fullName: form.fullName, phone: form.phone });
      login(res.data.data.user, res.data.data.token);
      toast.success('Đăng ký thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post('/auth/google', {
        credential: credentialResponse.credential
      });
      login(res.data.data.user, res.data.data.token);
      toast.success('Đăng ký với Google thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký với Google thất bại');
    }
  };

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
        <h1 className="auth-title">Tạo Tài Khoản Mới</h1>
        <p className="auth-subtitle">Đăng ký để bắt đầu hành trình học tập</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Họ Tên</label>
            <div className="input-icon-wrap">
              <User size={16} className="input-icon" />
              <input type="text" required className="form-control" placeholder="Nguyễn Văn A" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} style={{paddingLeft:'2.5rem'}} />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input type="email" required className="form-control" placeholder="email@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{paddingLeft:'2.5rem'}} />
            </div>
          </div>
          <div className="form-group">
            <label>Số Điện Thoại</label>
            <div className="input-icon-wrap">
              <Phone size={16} className="input-icon" />
              <input type="tel" className="form-control" placeholder="0901 234 567" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{paddingLeft:'2.5rem'}} />
            </div>
          </div>
          <div className="form-group">
            <label>Mật Khẩu</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input type={showPass ? 'text' : 'password'} required className="form-control" placeholder="Ít nhất 6 ký tự" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={{paddingLeft:'2.5rem', paddingRight:'3rem'}} />
              <button type="button" className="input-eye" onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          <div className="form-group">
            <label>Xác Nhận Mật Khẩu</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input type="password" required className="form-control" placeholder="Nhập lại mật khẩu" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} style={{paddingLeft:'2.5rem'}} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{width:'100%'}} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng Ký Ngay'}
          </button>

          <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>HOẶC</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <div className="google-auth-btn" style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Đăng ký Google thất bại')}
              theme="filled_blue"
              shape="pill"
            />
          </div>
        </form>

        <p className="auth-switch" style={{ marginTop: '2rem' }}>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
      </div>
    </div>
  );
}
