import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, BookOpen, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { getDeviceId } from '../lib/deviceId';
import useAuthStore from '../store/authStore';
import './Auth.css';

import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';
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
    setLoading(true);
    try {
      const deviceId = getDeviceId();
      const res = await api.post('/auth/login', { ...form, deviceId }, {
        headers: { 'X-Device-Id': deviceId },
      });
      const { user, token, sessionWarning, deviceId: serverDeviceId } = res.data.data;
      login(user, token, serverDeviceId);
      if (sessionWarning) toast(sessionWarning, { icon: '⚠️', duration: 6000 });
      toast.success('Đăng nhập thành công!');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post('/auth/google', {
        credential: credentialResponse.credential
      });
      const { user, token, sessionWarning } = res.data.data;
      login(user, token);
      if (sessionWarning) toast(sessionWarning, { icon: '⚠️', duration: 6000 });
      toast.success('Đăng nhập với Google thành công!');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập với Google thất bại');
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
        <h1 className="auth-title">Chào Mừng Trở Lại!</h1>
        <p className="auth-subtitle">Đăng nhập để tiếp tục học tập</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input
                type="email" required
                className="form-control"
                placeholder="email@example.com"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Mật Khẩu</label>
              <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary-light)' }}>Quên mật khẩu?</Link>
            </div>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                type={showPass ? 'text' : 'password'} required
                className="form-control"
                placeholder="Nhập mật khẩu"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                style={{ paddingLeft: '2.5rem', paddingRight: '3rem' }}
              />
              <button type="button" className="input-eye" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{width:'100%'}} disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>

          <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>HOẶC</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <div className="google-auth-btn" style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Đăng nhập Google thất bại')}
              useOneTap
              theme="filled_blue"
              shape="pill"
            />
          </div>
        </form>

        <p className="auth-switch" style={{ marginTop: '2rem' }}>
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
