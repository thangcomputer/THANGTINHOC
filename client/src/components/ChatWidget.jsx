import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Send, Phone, User, MessageSquare } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './ChatWidget.css';

const CHAT_MESSAGES = ['Tư Vấn Ngay', 'Đăng Ký Học Tin Học'];

function SocialIcon({ icon, size = 24 }) {
  if (icon === 'zalo') return (
    <svg viewBox="0 0 614.501 613.667" width={size} height={size} fill="white">
      <path d="M464.721,301.399c-13.984-0.014-23.707,11.478-23.944,28.312c-0.251,17.771,9.168,29.208,24.037,29.202c14.287-0.007,23.799-11.095,24.01-27.995C489.028,313.536,479.127,301.399,464.721,301.399z"/>
      <path d="M291.83,301.392c-14.473-0.316-24.578,11.603-24.604,29.024c-0.02,16.959,9.294,28.259,23.496,28.502c15.072,0.251,24.592-10.87,24.539-28.707C315.214,313.318,305.769,301.696,291.83,301.392z"/>
      <path d="M310.518,3.158C143.102,3.158,7.375,138.884,7.375,306.3s135.727,303.142,303.143,303.142c167.415,0,303.143-135.727,303.143-303.142S477.933,3.158,310.518,3.158z M217.858,391.083c-33.364,0.818-66.828,1.353-100.133-0.343c-21.326-1.095-27.652-18.647-14.248-36.583c21.55-28.826,43.886-57.065,65.792-85.621c2.546-3.305,6.214-5.996,7.15-12.705c-16.609,0-32.784,0.04-48.958-0.013c-19.195-0.066-28.278-5.805-28.14-17.652c0.132-11.768,9.175-17.329,28.397-17.348c25.159-0.026,50.324-0.06,75.476,0.026c9.637,0.033,19.604,0.105,25.304,9.789c6.22,10.561,0.284,19.512-5.646,27.454c-21.26,28.497-43.015,56.624-64.559,84.902c-2.599,3.41-5.119,6.88-9.453,12.725c23.424,0,44.123-0.053,64.816,0.026c8.674,0.026,16.662,1.873,19.941,11.267C237.892,379.329,231.368,390.752,217.858,391.083z M350.854,330.211c0,13.417-0.093,26.841,0.039,40.265c0.073,7.599-2.599,13.647-9.512,17.084c-7.296,3.642-14.71,3.028-20.304-2.968c-3.997-4.281-6.214-3.213-10.488-0.422c-17.955,11.728-39.908,9.96-56.597-3.866c-29.928-24.789-30.026-74.803-0.211-99.776c16.194-13.562,39.592-15.462,56.709-4.143c3.951,2.619,6.201,4.815,10.396-0.053c5.39-6.267,13.055-6.761,20.271-3.357c7.454,3.509,9.935,10.165,9.776,18.265C350.67,304.222,350.86,317.217,350.854,330.211z M395.617,369.579c-0.118,12.837-6.398,19.783-17.196,19.908c-10.779,0.132-17.593-6.966-17.646-19.512c-0.179-43.352-0.185-86.696,0.007-130.041c0.059-12.256,7.302-19.921,17.896-19.222c11.425,0.752,16.992,7.448,16.992,18.833c0,22.104,0,44.216,0,66.327C395.677,327.105,395.828,348.345,395.617,369.579z M463.981,391.868c-34.399-0.336-59.037-26.444-58.786-62.289c0.251-35.66,25.304-60.713,60.383-60.396c34.631,0.304,59.374,26.306,58.998,61.986C524.207,366.492,498.534,392.205,463.981,391.868z"/>
    </svg>
  );
  if (icon === 'messenger') return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="white">
      <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z"/>
    </svg>
  );
  if (icon === 'facebook') return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="white">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.271h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
  if (icon === 'phone') return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="white">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="white">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
    </svg>
  );
}

export default function ChatWidget({ settings }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);

  // Animated pill text cycle
  useEffect(() => {
    let mounted = true;
    let t;
    let idx = 0;

    function runCycle() {
      if (!mounted) return;
      setMsgIdx(idx);
      setExpanded(true);
      t = setTimeout(() => {
        if (!mounted) return;
        setExpanded(false);
        t = setTimeout(() => {
          if (!mounted) return;
          idx = (idx + 1) % CHAT_MESSAGES.length;
          runCycle();
        }, 700);
      }, 3000);
    }

    t = setTimeout(runCycle, 1200);
    return () => { mounted = false; clearTimeout(t); };
  }, []);

  const allowedPages = (() => {
    try { return JSON.parse(settings?.chat_widget_pages || '["all"]'); } catch { return ['all']; }
  })();
  const isAllowed = allowedPages.includes('all') ||
    allowedPages.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  const chatBtns = (() => {
    try { return JSON.parse(settings?.social_buttons || '[]').filter(b => b.show_chat && b.url); }
    catch { return []; }
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone || !formData.content) return toast.error('Vui lòng điền đầy đủ thông tin');
    setLoading(true);
    try {
      await api.post('/contacts', formData);
      toast.success('Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi sớm nhất.');
      setFormData({ name: '', phone: '', email: '', content: '' });
      setIsOpen(false);
    } catch {
      toast.error('Lỗi khi gửi tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  if (!isAllowed) return null;

  return (
    <div className="chat-widget-container">

      {/* Social floating buttons */}
      {chatBtns.length > 0 && (
        <div className={`social-floating-buttons ${isOpen ? 'hidden' : ''}`}>
          {chatBtns.map(btn => (
            <a key={btn.id} href={btn.url} target="_blank" rel="noreferrer" title={btn.label}
              className="social-float-btn pulse"
              style={{ background: btn.color, boxShadow: `0 0 16px ${btn.color}99` }}>
              <SocialIcon icon={btn.icon} size={24} />
            </a>
          ))}
        </div>
      )}

      {/* Main CTA Pill Button */}
      <button
        className={`chat-cta-pill ${isOpen ? 'hidden' : ''} ${expanded ? 'pill-expanded' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Tư vấn trực tuyến"
      >
        {/* Glow ring */}
        <span className="pill-ring" />

        {/* Icon */}
        <span className="pill-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
          </svg>
        </span>

        {/* Animated text */}
        <span className="pill-text-wrap">
          <span className="pill-text">{CHAT_MESSAGES[msgIdx]}</span>
        </span>
      </button>

      {/* Close / reopen when panel open */}
      {isOpen && (
        <button className="chat-toggle-btn active" onClick={() => setIsOpen(false)}>
          <X size={26} />
        </button>
      )}

      {/* Chat Form Panel */}
      <div className={`chat-panel ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <div className="chat-header-avatar">🎧</div>
          <div className="chat-header-info">
            <h3>Tư Vấn Trực Tuyến</h3>
            <div className="chat-status">
              <span className="chat-status-dot" />
              Đang trực tuyến - Phản hồi nhanh
            </div>
          </div>
        </div>

        <form className="chat-body" onSubmit={handleSubmit}>
          <div className="chat-input-group">
            <User size={18} className="input-icon" />
            <input type="text" placeholder="Họ và tên" value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="chat-input-group">
            <Phone size={18} className="input-icon" />
            <input type="tel" inputMode="numeric" pattern="[0-9]*"
              placeholder="Số điện thoại *" required value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value.replace(/[^0-9]/g, '')})} />
          </div>
          <div className="chat-input-group">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="input-icon" style={{color:'rgba(255,255,255,0.3)'}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <input type="email" placeholder="Email (không bắt buộc)" value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="chat-input-group area">
            <MessageSquare size={18} className="input-icon" />
            <textarea placeholder="Nội dung cần tư vấn... *" rows="3" required
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})} />
          </div>
          <button type="submit" className="chat-submit-btn" disabled={loading}>
            {loading ? 'Đang gửi...' : <><Send size={18} /> Gửi Yêu Cầu</>}
          </button>
        </form>

        <div className="chat-footer">
          <span>Phản hồi trong vòng 5-10 phút</span>
        </div>
      </div>
    </div>
  );
}
