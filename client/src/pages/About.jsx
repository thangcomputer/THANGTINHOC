import { useState, useEffect } from 'react';
import { Award, Users, Target, Heart, BookOpen, Star, CheckCircle, Zap } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import api from '../lib/api';
import './About.css';

export default function About() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    api.get('/settings').then(res => setSettings(res.data.data || {})).catch(() => {});
  }, []);

  const siteName = settings?.site_name || 'Thắng Tin Học';

  const milestones = [
    { year: '2018', title: 'Thành lập', desc: 'Bắt đầu hành trình đào tạo tin học với 2 giáo viên' },
    { year: '2020', title: 'Mở rộng', desc: 'Trở thành trung tâm khảo thí IC3/MOS ủy quyền' },
    { year: '2022', title: 'Online', desc: 'Ra mắt nền tảng học trực tuyến, phục vụ học viên toàn quốc' },
    { year: '2024', title: 'AI', desc: 'Tích hợp AI vào giáo trình, nâng tầm chất lượng đào tạo' },
  ];

  const values = [
    { icon: Target, title: 'Sứ mệnh', desc: 'Phổ cập tin học cho mọi người, giúp mỗi cá nhân tự tin trong thời đại số.' },
    { icon: Heart, title: 'Tận tâm', desc: 'Mỗi học viên đều được quan tâm, hỗ trợ cá nhân hóa từ lúc đăng ký đến khi ra trường.' },
    { icon: Zap, title: 'Hiệu quả', desc: 'Phương pháp "Học đi đôi với hành" — thực hành ngay trên dự án thực tế.' },
    { icon: Star, title: 'Chất lượng', desc: 'Giáo viên có ít nhất 3 năm kinh nghiệm, giáo trình cập nhật liên tục.' },
  ];

  return (
    <div className="about-page">
      {/* Hero */}
      <section className="about-hero">
        <div className="container">
          <ScrollReveal animation="fade-up">
            <div className="about-badge"><Award size={14} /> Về Chúng Tôi</div>
            <h1>Câu Chuyện <span className="highlight">{siteName}</span></h1>
            <p className="about-hero-desc">
              Chúng tôi tin rằng mỗi người đều xứng đáng có cơ hội tiếp cận công nghệ. 
              Từ một lớp học nhỏ, chúng tôi đã phát triển thành trung tâm đào tạo tin học 
              hàng đầu với hàng ngàn học viên mỗi năm.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats */}
      <section className="about-stats">
        <div className="container">
          <div className="stats-grid">
            {[
              { num: '5,000+', label: 'Học viên' },
              { num: '50+', label: 'Khóa học' },
              { num: '20+', label: 'Giáo viên' },
              { num: '98%', label: 'Hài lòng' },
            ].map((s, i) => (
              <ScrollReveal key={i} animation="fade-up" delay={i * 100}>
                <div className="stat-card">
                  <span className="stat-num">{s.num}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-values">
        <div className="container">
          <ScrollReveal animation="fade-up">
            <div className="section-center" style={{ marginBottom: '32px' }}>
              <h2 className="section-title">Giá Trị <span className="highlight">Cốt Lõi</span></h2>
            </div>
          </ScrollReveal>
          <div className="values-grid">
            {values.map((v, i) => (
              <ScrollReveal key={i} animation="fade-up" delay={i * 100}>
                <div className="value-card">
                  <div className="value-icon"><v.icon size={22} /></div>
                  <h3>{v.title}</h3>
                  <p>{v.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="about-timeline">
        <div className="container">
          <ScrollReveal animation="fade-up">
            <div className="section-center" style={{ marginBottom: '40px' }}>
              <h2 className="section-title">Hành Trình <span className="highlight">Phát Triển</span></h2>
            </div>
          </ScrollReveal>
          <div className="timeline">
            {milestones.map((m, i) => (
              <ScrollReveal key={i} animation={i % 2 === 0 ? 'fade-right' : 'fade-left'} delay={i * 150}>
                <div className={`timeline-item ${i % 2 === 0 ? 'left' : 'right'}`}>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <span className="timeline-year">{m.year}</span>
                    <h3>{m.title}</h3>
                    <p>{m.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="container">
          <ScrollReveal animation="fade-up">
            <div className="cta-box">
              <h2>Sẵn sàng bắt đầu?</h2>
              <p>Tham gia cùng hàng ngàn học viên đã thay đổi sự nghiệp nhờ tin học</p>
              <div className="cta-buttons">
                <a href="/courses" className="btn btn-primary">Xem Khóa Học</a>
                <a href="/tuyen-dung" className="btn btn-outline-light">Gia Nhập Đội Ngũ</a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
