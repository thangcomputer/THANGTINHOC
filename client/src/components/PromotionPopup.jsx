import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sanitizeHTML } from '../lib/sanitize';

export default function PromotionPopup({ enabled, content }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Should be boolean/string from backend
    if (enabled !== 'true' || !content) return;

    // Check if shown today
    const lastSeen = localStorage.getItem('promo_closed_date');
    const today = new Date().toDateString();

    if (lastSeen !== today) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [enabled, content]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('promo_closed_date', new Date().toDateString());
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      <div 
        className="animate-fade-in"
        style={{
          background: 'var(--bg-card)', width: '100%', maxWidth: '500px',
          borderRadius: 'var(--radius-lg)', position: 'relative',
          overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}
      >
        <button 
          onClick={handleClose}
          style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: '50%',
            width: '32px', height: '32px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', cursor: 'pointer', zIndex: 10, color: 'var(--text-primary)'
          }}
        >
          <X size={18} />
        </button>
        
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'white' }}>
            <span style={{ fontSize: '2rem' }}>🎉</span>
          </div>
          <h2 style={{ marginBottom: '1rem', color: 'var(--primary-light)' }}>Ưu Đãi Đặc Biệt!</h2>
          <div 
            style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }}
          />
          <Link 
            to="/courses" 
            onClick={handleClose}
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.8rem', justifyContent: 'center', fontSize: '1rem' }}
          >
            Xem Khóa Học Ngay <ExternalLink size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
