import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
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
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setIsSent(true);
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
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
        <h2 className="auth-title">Quên Mật Khẩu</h2>
        <p className="auth-subtitle">
          {isSent 
            ? 'Vui lòng kiểm tra hộp thư email của bạn (bao gồm cả thư rác) để lấy liên kết khôi phục.' 
            : 'Nhập email của bạn để nhận liên kết đặt lại mật khẩu.'}
        </p>

        {isSent ? (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', padding: '0.75rem 2rem' }}>
              Quay Lại Đăng Nhập
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>
                <Mail size={16} /> Email
              </label>
              <input 
                type="email" 
                required 
                className="form-control" 
                placeholder="Ví dụ: hocvien@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '1rem', justifyContent: 'center' }} disabled={loading}>
              <Send size={18} /> {loading ? 'Đang Xử Lý...' : 'Gửi Liên Kết'}
            </button>

            <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <ArrowLeft size={16} /> Quay lại đăng nhập
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
