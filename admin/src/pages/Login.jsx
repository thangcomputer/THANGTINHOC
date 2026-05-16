import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { getDeviceId } from '../lib/deviceId';
import useAuthStore from '../store/authStore';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') navigate('/', { replace: true });
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const deviceId = getDeviceId();
      const res = await api.post('/auth/login', { ...form, deviceId }, {
        headers: { 'X-Device-Id': deviceId },
      });
      const { user, token, sessionWarning, deviceId: serverDeviceId } = res.data.data;
      if (user.role !== 'admin') throw new Error('Cần quyền Admin để truy cập');
      login(user, token, serverDeviceId);
      if (sessionWarning) toast(sessionWarning, { icon: '⚠️', duration: 6000 });
      toast.success('Đăng nhập Admin thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 40%, #0f172a 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
        top: '-200px',
        right: '-200px',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
        bottom: '-100px',
        left: '-100px',
        pointerEvents: 'none',
      }} />

      <div className="animate-scale-in" style={{
        width: '420px',
        maxWidth: 'calc(100vw - 40px)',
        background: 'rgba(255, 255, 255, 0.97)',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '32px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #818cf8 100%)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
          }}>
            <Terminal size={24} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              Thắng Admin
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Bảng điều khiển
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Đăng Nhập Quản Trị
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Dành riêng cho quản trị viên hệ thống
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input 
                type="email" 
                required 
                className="form-control" 
                style={{ paddingLeft: '42px' }} 
                placeholder="admin@thangtinhoc.vn"
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})} 
              />
            </div>
          </div>
          <div className="form-group">
            <label>Mật Khẩu</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input 
                type="password" 
                required 
                className="form-control" 
                style={{ paddingLeft: '42px' }} 
                placeholder="••••••••"
                value={form.password} 
                onChange={e => setForm({...form, password: e.target.value})} 
              />
            </div>
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              marginTop: '8px', 
              padding: '12px',
              fontSize: '0.95rem',
            }} 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spinner" />
                Đang xử lý...
              </>
            ) : (
              <>
                Đăng Nhập
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}>
          Quên mật khẩu? Liên hệ quản trị hệ thống.
        </p>
        {import.meta.env.DEV && (
          <p style={{
            textAlign: 'center',
            marginTop: '12px',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            opacity: 0.85,
          }}>
            Dev: admin@thangtinhoc.vn / admin123 (sau <code>npm run db:seed</code>)
          </p>
        )}
      </div>
    </div>
  );
}
