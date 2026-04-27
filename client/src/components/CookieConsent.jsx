import { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Small delay before showing
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="animate-fade-in" style={{
      position: 'fixed', bottom: '20px', left: '20px', zIndex: 9998,
      backgroundColor: 'var(--bg-card)', padding: '1.25rem',
      borderRadius: 'var(--radius)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      border: '1px solid var(--border)', maxWidth: '400px', display: 'flex', gap: '1rem', alignItems: 'flex-start'
    }}>
      <div style={{ color: 'var(--primary-light)', flexShrink: 0, marginTop: '2px' }}>
        <Cookie size={24} />
      </div>
      <div>
        <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Quản lý Cookie</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
          Chúng tôi sử dụng cookie để lưu trữ phiên đăng nhập và cải thiện trải nghiệm học tập của bạn trên nền tảng.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={acceptCookies} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
            Đồng Ý
          </button>
          <a href="#" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'underline', alignSelf: 'center' }}>
            Chính sách bảo mật
          </a>
        </div>
      </div>
    </div>
  );
}
