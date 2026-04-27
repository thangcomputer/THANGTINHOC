import { useState } from 'react';
import { Send, Loader2, CheckCircle, Briefcase, GraduationCap, Clock, MapPin, Phone, Mail, User, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import ScrollReveal from '../components/ScrollReveal';
import './Recruitment.css';

const EXPERTISE_OPTIONS = [
  { id: 'tin-hoc-van-phong', label: 'Tin học văn phòng' },
  { id: 'ai', label: 'AI ứng dụng' },
  { id: 'photoshop', label: 'Photoshop' },
  { id: 'corel', label: 'CorelDRAW' },
  { id: 'autocad', label: 'AutoCAD' },
  { id: 'other', label: 'Khác' },
];

const SCHEDULE_OPTIONS = [
  { id: 'sang', label: 'Sáng (8h-12h)', icon: '🌅' },
  { id: 'trua', label: 'Trưa (12h-14h)', icon: '☀️' },
  { id: 'chieu', label: 'Chiều (14h-17h)', icon: '🌤️' },
  { id: 'toi', label: 'Tối (18h-21h)', icon: '🌙' },
];

export default function Recruitment() {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', age: '',
    hometown: '', degree: '', experience: '',
    teachMode: '', expertise: [], schedule: [], note: '',
  });

  const toggleArray = (key, val) => {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter(x => x !== val) : [...prev[key], val]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.email || !form.degree) {
      return toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
    }
    if (form.expertise.length === 0) return toast.error('Chọn ít nhất 1 chuyên môn');
    if (form.schedule.length === 0) return toast.error('Chọn ít nhất 1 khung giờ');

    setSending(true);
    try {
      await api.post('/recruitment', {
        ...form,
        expertise: JSON.stringify(form.expertise),
        schedule: JSON.stringify(form.schedule),
      });
      setSuccess(true);
    } catch { toast.error('Lỗi gửi đơn, vui lòng thử lại'); }
    finally { setSending(false); }
  };

  if (success) {
    return (
      <div className="recruit-page">
        <div className="container" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="recruit-success-card">
            <div className="success-icon-ring">
              <CheckCircle size={56} />
            </div>
            <h2>Ứng Tuyển Thành Công!</h2>
            <p>Cảm ơn bạn đã quan tâm đến cơ hội giảng dạy tại <strong>Thắng Tin Học</strong>.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chúng tôi sẽ xem xét hồ sơ và liên hệ bạn trong vòng <strong>2-3 ngày làm việc</strong>.</p>
            <div className="success-actions">
              <a href="/" className="btn btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: '50px' }}>← Về Trang Chủ</a>
              <button className="btn btn-outline" style={{ padding: '0.75rem 2rem', borderRadius: '50px' }} onClick={() => { setSuccess(false); setForm({ fullName: '', phone: '', email: '', age: '', hometown: '', degree: '', experience: '', teachMode: '', expertise: [], schedule: [], note: '' }); }}>Gửi Đơn Khác</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recruit-page">
      {/* Hero */}
      <section className="recruit-hero">
        <div className="container">
          <ScrollReveal animation="fade-up">
            <div className="recruit-hero-badge"><Briefcase size={14} /> Cơ Hội Nghề Nghiệp</div>
            <h1>Tuyển Dụng <span className="highlight">Giáo Viên</span></h1>
            <p>Gia nhập đội ngũ giảng viên của Thắng Tin Học — nơi bạn có thể chia sẻ kiến thức, phát triển sự nghiệp và tạo ra tác động tích cực.</p>
          </ScrollReveal>
        </div>
      </section>

      {/* Benefits */}
      <section className="recruit-benefits">
        <div className="container">
          <div className="recruit-benefits-grid">
            {[
              { icon: '💰', title: 'Thu nhập hấp dẫn', desc: 'Mức lương cạnh tranh, thưởng theo kết quả giảng dạy' },
              { icon: '🕐', title: 'Giờ linh hoạt', desc: 'Chọn khung giờ phù hợp: sáng, chiều hoặc tối' },
              { icon: '🏠', title: 'Online & Offline', desc: 'Giảng dạy trực tuyến hoặc trực tiếp tùy bạn' },
              { icon: '📈', title: 'Phát triển bản thân', desc: 'Đào tạo nâng cao, tài liệu giảng dạy chuẩn' },
            ].map((b, i) => (
              <ScrollReveal key={i} animation="fade-up" delay={i * 100}>
                <div className="benefit-card">
                  <span className="benefit-icon">{b.icon}</span>
                  <h3>{b.title}</h3>
                  <p>{b.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="recruit-form-section">
        <div className="container">
          <ScrollReveal animation="fade-up">
            <div className="section-center" style={{ marginBottom: '32px' }}>
              <div className="section-tag"><GraduationCap size={14} /> Đơn Ứng Tuyển</div>
              <h2 className="section-title">Ghi Danh <span className="highlight">Giáo Viên</span></h2>
              <p className="section-subtitle">Điền thông tin bên dưới, chúng tôi sẽ liên hệ bạn sớm nhất</p>
            </div>
          </ScrollReveal>

          <form onSubmit={handleSubmit} className="recruit-form">
            {/* Personal Info */}
            <div className="recruit-card">
              <h3 className="recruit-card-title"><User size={16} /> Thông Tin Cá Nhân</h3>
              <div className="recruit-grid">
                <div className="form-group">
                  <label>Họ và tên <span className="req">*</span></label>
                  <input type="text" className="form-input" placeholder="Nguyễn Văn A" value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label><Phone size={12} /> Số điện thoại <span className="req">*</span></label>
                  <input type="tel" inputMode="numeric" pattern="[0-9]*" className="form-input" placeholder="0909..." value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '') })} required />
                </div>
                <div className="form-group">
                  <label><Mail size={12} /> Email <span className="req">*</span></label>
                  <input type="email" className="form-input" placeholder="email@gmail.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Tuổi</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" className="form-input" placeholder="VD: 28" value={form.age}
                    onChange={e => setForm({ ...form, age: e.target.value.replace(/[^0-9]/g, '') })} />
                </div>
                <div className="form-group full-width">
                  <label><MapPin size={12} /> Quê quán</label>
                  <input type="text" className="form-input" placeholder="VD: TP. Hồ Chí Minh" value={form.hometown}
                    onChange={e => setForm({ ...form, hometown: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Professional Info */}
            <div className="recruit-card">
              <h3 className="recruit-card-title"><Award size={16} /> Trình Độ & Kinh Nghiệm</h3>
              <div className="recruit-grid">
                <div className="form-group">
                  <label>Bằng cấp <span className="req">*</span></label>
                  <select className="form-input" value={form.degree}
                    onChange={e => setForm({ ...form, degree: e.target.value })} required>
                    <option value="">-- Chọn --</option>
                    <option value="trung-cap">Trung cấp</option>
                    <option value="cao-dang">Cao đẳng</option>
                    <option value="dai-hoc">Đại học</option>
                    <option value="thac-si">Thạc sĩ</option>
                    <option value="tien-si">Tiến sĩ</option>
                    <option value="chung-chi">Chứng chỉ nghề</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Hình thức giảng dạy</label>
                  <select className="form-input" value={form.teachMode}
                    onChange={e => setForm({ ...form, teachMode: e.target.value })}>
                    <option value="">-- Chọn --</option>
                    <option value="online">Online (trực tuyến)</option>
                    <option value="offline">Offline (trực tiếp)</option>
                    <option value="both">Cả hai</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Kinh nghiệm giảng dạy</label>
                  <textarea className="form-input" rows="2" placeholder="VD: 3 năm dạy Tin học VP tại trung tâm XYZ..."
                    value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Expertise */}
            <div className="recruit-card">
              <h3 className="recruit-card-title"><Briefcase size={16} /> Chuyên Môn <span className="req">*</span></h3>
              <div className="recruit-chip-grid">
                {EXPERTISE_OPTIONS.map(opt => (
                  <button key={opt.id} type="button"
                    className={`recruit-chip ${form.expertise.includes(opt.id) ? 'active' : ''}`}
                    onClick={() => toggleArray('expertise', opt.id)}>
                    {form.expertise.includes(opt.id) ? '✓' : '+'} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="recruit-card">
              <h3 className="recruit-card-title"><Clock size={16} /> Thời Gian Giảng Dạy <span className="req">*</span></h3>
              <div className="recruit-schedule-grid">
                {SCHEDULE_OPTIONS.map(opt => (
                  <button key={opt.id} type="button"
                    className={`schedule-chip ${form.schedule.includes(opt.id) ? 'active' : ''}`}
                    onClick={() => toggleArray('schedule', opt.id)}>
                    <span className="schedule-icon">{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="recruit-card">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Ghi chú thêm</label>
                <textarea className="form-input" rows="3" placeholder="Bạn muốn chia sẻ thêm điều gì..."
                  value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
              </div>
            </div>

            <button type="submit" className="recruit-submit" disabled={sending}>
              {sending ? <><Loader2 size={20} className="spin" /> Đang gửi...</> :
                <><Send size={20} /> GỬI ĐƠN ỨNG TUYỂN</>}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
