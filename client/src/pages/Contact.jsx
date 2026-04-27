import { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Clock, Send, Loader2, CheckCircle, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import ScrollReveal from '../components/ScrollReveal';
import './Contact.css';

export default function Contact() {
  const [settings, setSettings] = useState({});
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', message: '' });

  useEffect(() => {
    api.get('/settings').then(res => setSettings(res.data.data || {})).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) return toast.error('Vui lòng điền đầy đủ thông tin');
    setSending(true);
    try {
      await api.post('/contacts', {
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        subject: form.subject || null,
        content: form.message
      });
      setSuccess(true);
    } catch { toast.error('Lỗi gửi tin nhắn'); }
    finally { setSending(false); }
  };

  const address = settings?.address || '123 Đường Tin Học, Quận 1, TP.HCM';
  const phone = settings?.contact_phone || '0901 234 567';
  const email = settings?.contact_email || 'info@thangtinhoc.vn';

  return (
    <div className="contact-page">
      {/* Hero */}
      <section className="contact-hero">
        <div className="container">
          <ScrollReveal animation="fade-up">
            <div className="contact-badge"><MessageSquare size={14} /> Liên Hệ</div>
            <h1>Kết Nối Với <span className="highlight">Chúng Tôi</span></h1>
            <p>Bạn có câu hỏi? Hãy liên hệ — chúng tôi luôn sẵn sàng hỗ trợ!</p>
          </ScrollReveal>
        </div>
      </section>

      <section className="contact-body">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Info */}
            <ScrollReveal animation="fade-right">
              <div className="contact-info">
                <h2>Thông Tin Liên Hệ</h2>
                <div className="info-cards">
                  <div className="info-card">
                    <div className="info-icon"><MapPin size={20} /></div>
                    <div>
                      <h4>Địa chỉ</h4>
                      <p>{address}</p>
                    </div>
                  </div>
                  <div className="info-card">
                    <div className="info-icon"><Phone size={20} /></div>
                    <div>
                      <h4>Điện thoại</h4>
                      <p><a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a></p>
                    </div>
                  </div>
                  <div className="info-card">
                    <div className="info-icon"><Mail size={20} /></div>
                    <div>
                      <h4>Email</h4>
                      <p><a href={`mailto:${email}`}>{email}</a></p>
                    </div>
                  </div>
                  <div className="info-card">
                    <div className="info-icon"><Clock size={20} /></div>
                    <div>
                      <h4>Giờ làm việc</h4>
                      <p>{settings?.footer_hours_weekday || 'Thứ 2 - Thứ 7: 8:00 - 21:00'}</p>
                      <p>{settings?.footer_hours_weekend || 'Chủ Nhật: 8:00 - 17:00'}</p>
                    </div>
                  </div>
                </div>

                {/* Social */}
                <div className="contact-social">
                  <h4>Theo dõi chúng tôi</h4>
                  <div className="social-row">
                    {settings?.facebook_url && (
                      <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="social-link fb">Facebook</a>
                    )}
                    {settings?.youtube_url && (
                      <a href={settings.youtube_url} target="_blank" rel="noreferrer" className="social-link yt">YouTube</a>
                    )}
                    {settings?.zalo_url && (
                      <a href={settings.zalo_url} target="_blank" rel="noreferrer" className="social-link zl">Zalo</a>
                    )}
                    {settings?.tiktok_url && (
                      <a href={settings.tiktok_url} target="_blank" rel="noreferrer" className="social-link tk">TikTok</a>
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Form */}
            <ScrollReveal animation="fade-left">
              {success ? (
                <div className="contact-success">
                  <div className="success-icon-ring">
                    <CheckCircle size={56} />
                  </div>
                  <h3>Gửi Tin Nhắn Thành Công!</h3>
                  <p>Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong vòng <strong>24 giờ</strong>.</p>
                  <div className="success-actions">
                    <button className="contact-btn" onClick={() => { setSuccess(false); setForm({ name: '', phone: '', email: '', subject: '', message: '' }); }}>
                      <Send size={16} /> Gửi Tin Nhắn Mới
                    </button>
                  </div>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <h2>Gửi Tin Nhắn</h2>
                  <div className="cf-grid">
                    <div className="cf-field">
                      <label>Họ và tên <span className="req">*</span></label>
                      <input type="text" placeholder="Nguyễn Văn A" value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="cf-field">
                      <label>Số điện thoại <span className="req">*</span></label>
                      <input type="tel" inputMode="numeric" pattern="[0-9]*" placeholder="0909..." value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '') })} required />
                    </div>
                  </div>
                  <div className="cf-grid">
                    <div className="cf-field">
                      <label>Email</label>
                      <input type="email" placeholder="email@gmail.com" value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="cf-field">
                      <label>Chủ đề</label>
                      <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                        <option value="">-- Chọn --</option>
                        <option value="Tư vấn khóa học">Tư vấn khóa học</option>
                        <option value="Đăng ký thi">Đăng ký thi</option>
                        <option value="Hỗ trợ kỹ thuật">Hỗ trợ kỹ thuật</option>
                        <option value="Hợp tác">Hợp tác</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                  </div>
                  <div className="cf-field">
                    <label>Nội dung <span className="req">*</span></label>
                    <textarea rows="4" placeholder="Bạn muốn hỏi điều gì..." value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })} required />
                  </div>
                  <button type="submit" className="contact-btn" disabled={sending}>
                    {sending ? <><Loader2 size={18} className="spin" /> Đang gửi...</> :
                      <><Send size={18} /> Gửi Tin Nhắn</>}
                  </button>
                </form>
              )}
            </ScrollReveal>
          </div>

          {/* Map embed */}
          {settings?.google_maps_embed && (() => {
            // Support both full <iframe> HTML and plain URL
            const raw = settings.google_maps_embed;
            const srcMatch = raw.match(/src=["']([^"']+)["']/);
            const mapSrc = srcMatch ? srcMatch[1] : (raw.startsWith('http') ? raw : null);
            if (!mapSrc) return null;
            return (
              <ScrollReveal animation="fade-up">
                <div className="contact-map">
                  <iframe src={mapSrc} width="100%" height="350" style={{ border: 0, borderRadius: '12px' }}
                    allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Map" />
                </div>
              </ScrollReveal>
            );
          })()}
        </div>
      </section>
    </div>
  );
}
