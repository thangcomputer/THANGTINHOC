import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Play, Star, Users, BookOpen, Award, TrendingUp,
  CheckCircle, Zap, Shield, Clock, ChevronRight, Quote,
  FileText, Layout, Table, GraduationCap, Monitor, Sparkles,
  Target, BarChart3, Laptop, MessageSquare, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../lib/api';
import { sanitizeHTML } from '../lib/sanitize';
import CourseCard from '../components/CourseCard';
import ScrollReveal, { StaggerReveal } from '../components/ScrollReveal';
import VideoPlayer from '../components/VideoPlayer';
import './Home.css';

const IconMap = { Zap, Shield, Award, Users, Clock, TrendingUp, BookOpen, Target, Monitor, GraduationCap, CheckCircle, Star };

export default function Home({ settings }) {
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);
  const [showNav, setShowNav] = useState(false);
  const [showPromo, setShowPromo] = useState(false);

  const sectionIdsRef = useRef([]);

  useEffect(() => {
    api.get('/courses?featured=true&limit=6').then(res => {
      setFeaturedCourses(res.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Promo popup — show once per session if enabled in settings
  useEffect(() => {
    if (settings?.promo_enabled !== 'true') return;
    const dismissed = sessionStorage.getItem('promo_dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => setShowPromo(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [settings]);

  // Track which section is current (uses ref for dynamic sections)
  useEffect(() => {
    const handleScroll = () => {
      setShowNav(window.scrollY > 100);
      const ids = sectionIdsRef.current;
      if (!ids.length) return;
      const scrollPos = window.scrollY + window.innerHeight / 2;
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i]);
        if (el && el.offsetTop <= scrollPos) {
          setCurrentSection(i);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLastSection = currentSection >= (sectionIdsRef.current.length || 1) - 1;

  const handleNavClick = () => {
    const ids = sectionIdsRef.current;
    if (isLastSection) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const nextId = ids[currentSection + 1];
      const el = document.getElementById(nextId);
      if (el) {
        const offset = el.offsetTop - 60;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    }
  };

  // Parse animation settings
  // Khi settings chưa load (null) → tạm tắt animation (none) để tránh chạy sai
  // Khi settings đã load → dùng giá trị từ API, fallback 'fade-up' nếu không có
  const settingsLoaded = settings !== null && settings !== undefined;
  const anim = {
    hero: settingsLoaded ? (settings.anim_hero || 'fade-up') : 'none',
    stats: settingsLoaded ? (settings.anim_stats || 'fade-up') : 'none',
    features: settingsLoaded ? (settings.anim_features || 'fade-up') : 'none',
    learningPath: settingsLoaded ? (settings.anim_learning_path || 'fade-up') : 'none',
    visual: settingsLoaded ? (settings.anim_visual || 'fade-right') : 'none',
    testimonials: settingsLoaded ? (settings.anim_testimonials || 'fade-up') : 'none',
    partners: settingsLoaded ? (settings.anim_partners || 'zoom-in') : 'none',
    cta: settingsLoaded ? (settings.anim_cta || 'fade-up') : 'none',
  };

  const officeFeatures = [
    { title: 'Microsoft Word', desc: 'Soạn thảo văn bản chuyên nghiệp, mail merge, tạo template báo cáo và hợp đồng chuẩn doanh nghiệp.', icon: '/word_icon_3d.png', color: '#2b579a' },
    { title: 'Microsoft Excel', desc: 'Hàm nâng cao, Pivot Table, Dashboard động, VBA macro tự động hóa và xử lý dữ liệu lớn.', icon: '/excel_icon_3d.png', color: '#217346' },
    { title: 'PowerPoint', desc: 'Thiết kế slide chuyên nghiệp, animation, infographic và kỹ năng thuyết trình ấn tượng.', icon: '/ppt_icon_3d.png', color: '#b7472a' },
    { title: 'Kỹ Năng Máy Tính', desc: 'Windows, quản lý file, bảo mật dữ liệu, sử dụng AI và công cụ đám mây hiệu quả.', icon: 'Zap', color: '#6366f1' },
  ];

  let features = [];
  try { features = JSON.parse(settings?.home_features || '[]'); } catch(e) { features = []; }
  if (features.length === 0) {
    features = [
      { icon: 'Zap', title: 'Học Linh Hoạt', desc: 'Học mọi lúc, mọi nơi trên mọi thiết bị' },
      { icon: 'Shield', title: 'Cam Kết Chất Lượng', desc: 'Hoàn tiền 100% nếu không hài lòng trong 7 ngày' },
      { icon: 'Award', title: 'Chứng Chỉ Uy Tín', desc: 'Nhận chứng chỉ được công nhận sau khi hoàn thành' },
      { icon: 'Users', title: 'Hỗ Trợ 24/7', desc: 'Đội ngũ hỗ trợ sẵn sàng giải đáp mọi thắc mắc' },
    ];
  }

  let testimonials = [];
  try { testimonials = JSON.parse(settings?.home_testimonials || '[]'); } catch(e) { testimonials = []; }
  if (testimonials.length === 0) {
    testimonials = [
      { name: 'Phạm Thị Lan', role: 'Kế Toán Viên', text: 'Khóa học Excel tại Thắng Tin Học đã giúp tôi tăng tốc công việc lên 3 lần. Thầy giảng dạy rất tận tâm và dễ hiểu!', rating: 5, avatar: '' },
      { name: 'Nguyễn Văn Hùng', role: 'Nhân Viên Văn Phòng', text: 'Tôi đã học Word và PowerPoint ở đây. Giờ tôi tự tin trình bày báo cáo trước hàng chục người. Cảm ơn thầy Thắng!', rating: 5, avatar: '' },
      { name: 'Trần Thanh Mai', role: 'Quản Lý Dự Án', text: 'Khóa học Excel nâng cao và Dashboard giúp tôi báo cáo KPI cho ban giám đốc một cách chuyên nghiệp. Rất đáng đầu tư!', rating: 5, avatar: '' },
    ];
  }

  const stats = [
    { value: '5,000+', label: 'Học Viên', icon: Users },
    { value: '50+', label: 'Khóa Học', icon: BookOpen },
    { value: '98%', label: 'Hài Lòng', icon: Award },
    { value: '10+', label: 'Năm Kinh Nghiệm', icon: TrendingUp },
  ];

  const learningPath = [
    { step: '01', title: 'Đăng Ký Tài Khoản', desc: 'Tạo tài khoản miễn phí chỉ trong 30 giây', icon: Target },
    { step: '02', title: 'Chọn Khóa Học', desc: 'Chọn lộ trình phù hợp với mục tiêu của bạn', icon: BookOpen },
    { step: '03', title: 'Học Online / Offline', desc: 'Học 1:1 trực tiếp hoặc qua video bài giảng', icon: Monitor },
    { step: '04', title: 'Nhận Chứng Chỉ', desc: 'Hoàn thành khóa học và nhận chứng chỉ uy tín', icon: GraduationCap },
  ];

  const partnersList = [
    { name: 'FPT Corporation', logo: '/logo_fpt.png' },
    { name: 'Viettel', logo: '/logo_viettel.png' },
    { name: 'VinGroup', logo: '/logo_vingroup.png' },
    { name: 'VNPT', logo: '/logo_vnpt.png' },
    { name: 'Samsung Vietnam', logo: '/logo_samsung.png' },
    { name: 'MISA', logo: '/logo_misa.png' },
  ];

  // Parse dynamic partners from settings
  let dynamicPartners = [];
  try { dynamicPartners = JSON.parse(settings?.home_partners || '[]'); } catch(e) {}
  const finalPartners = dynamicPartners.length > 0 ? dynamicPartners : partnersList;

  // Parse section_order & section_visibility from settings
  const defaultOrder = ['hero', 'stats', 'features', 'learning-path', 'visual-learning', 'courses', 'testimonials', 'partners', 'cta'];
  let sectionOrder = defaultOrder;
  try { 
    const parsed = JSON.parse(settings?.section_order || '[]');
    if (parsed.length > 0) sectionOrder = parsed;
  } catch(e) {}
  
  let sectionVisibility = {};
  try { sectionVisibility = JSON.parse(settings?.section_visibility || '{}'); } catch(e) {}

  // Parse custom containers
  let customSections = {};
  try { customSections = JSON.parse(settings?.custom_sections || '{}'); } catch(e) {}

  // Map section IDs to DOM element IDs for scroll navigator
  const SECTION_DOM_MAP = {
    'hero': 'hero', 'stats': 'stats-banner', 'features': 'features-section',
    'learning-path': 'learning-path', 'visual-learning': 'visual-learning',
    'courses': 'courses-section', 'testimonials': 'testimonials',
    'partners': 'partners', 'cta': 'cta-section',
  };
  // Add container IDs to DOM map dynamically
  sectionOrder.forEach(id => { if (id.startsWith('container-')) SECTION_DOM_MAP[id] = id; });
  
  // Only visible + ordered sections
  const visibleSections = sectionOrder.filter(id => !sectionVisibility[id]);
  const SECTION_IDS_NAV = visibleSections.map(id => SECTION_DOM_MAP[id]).filter(Boolean);
  sectionIdsRef.current = SECTION_IDS_NAV;

  // Section renderers
  const sectionRenderers = {
    'hero': () => (
      <section className="hero" id="hero" key="hero">
        <div className="hero-bg">
          <div className="hero-orb orb1" />
          <div className="hero-orb orb2" />
          <div className="hero-orb orb3" />
          <div className="hero-grid" />
          <div className="hero-noise" />
        </div>
        <div className="container hero-content">
          <ScrollReveal animation={anim.hero} duration={1000} className="hero-text">
            <div className="hero-badge">
              <Sparkles size={14} />
              <span>Chuyên Gia Tin Học Văn Phòng 4.0</span>
            </div>
            <h1 className="hero-title">
              {settings?.hero_title ? (
                settings.hero_title.split('\n').map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)
              ) : (
                <>Làm Chủ <span className="highlight-ai">Word, Excel</span><br />&amp; <span className="highlight-ai">PowerPoint</span></>
              )}
            </h1>
            <p className="hero-desc">
              {settings?.hero_subtitle || 'Khám phá lộ trình học tập chuyên sâu từ con số 0 đến bậc thầy tin học. Học kèm 1:1 online trực tiếp với chuyên gia, cam kết thành thạo sau khóa học.'}
            </p>
            <div className="hero-actions">
              <Link to={settings?.hero_btn_url || '/courses'} className="btn btn-primary btn-lg hero-cta">
                {settings?.hero_btn_text || 'Bắt Đầu Học Ngay'} <ArrowRight size={20} />
              </Link>
              <button className="btn-play-premium">
                <div className="play-icon-ai"><Play size={20} fill="white" /></div>
                <span>Xem Giới Thiệu</span>
              </button>
            </div>
            <div className="hero-trust">
              <div className="hero-avatars">
                {['P', 'N', 'T', 'H'].map((l, i) => (
                  <div key={i} className="hero-avatar-circle">{l}</div>
                ))}
              </div>
              <div className="hero-trust-text">
                <div className="hero-trust-stars">
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <span>5,000+ học viên tin tưởng</span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal animation={anim.hero} delay={300} duration={1000} className="hero-visual-premium">
            <div className="visual-wrapper">
              {settings?.hero_media_url ? (
                (settings?.hero_media_type === 'video') ? (
                  <div className="main-3d-character" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    {settings.hero_media_url.includes('youtube') || settings.hero_media_url.includes('youtu.be') ? (
                      <iframe src={settings.hero_media_url.replace('watch?v=', 'embed/')} 
                        style={{ width: '100%', height: '100%', minHeight: '350px', border: 'none' }} title="Hero Video" allowFullScreen />
                    ) : (
                      <VideoPlayer src={settings.hero_media_url} />
                    )}
                  </div>
                ) : (
                  <div className="main-3d-character">
                    <img src={settings.hero_media_url} alt="Hero Banner" />
                  </div>
                )
              ) : (
                <div className="main-3d-character">
                  <img src="/hero_3d_office_informatics.png" alt="3D Informatics Master" />
                </div>
              )}
              <div className="floating-3d word-3d float-slow">
                <img src="/word_icon_3d.png" alt="Word" />
                <div className="tool-glow word-glow" />
              </div>
              <div className="floating-3d excel-3d float-reverse">
                <img src="/excel_icon_3d.png" alt="Excel" />
                <div className="tool-glow excel-glow" />
              </div>
              <div className="floating-3d ppt-3d float-mid">
                <img src="/ppt_icon_3d.png" alt="PowerPoint" />
                <div className="tool-glow ppt-glow" />
              </div>
              <div className="hero-glass-card stats-card float-slow">
                <Users size={16} color="var(--primary-light)" />
                <span>+250 Học viên mới tháng này</span>
              </div>
            </div>
          </ScrollReveal>
        </div>

      </section>
    ),

    'stats': () => (
      <section className="stats-banner" id="stats-banner" key="stats">
        <div className="container">
          <StaggerReveal animation={anim.stats} staggerDelay={120} className="stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-icon-wrap"><s.icon size={24} /></div>
                <div className="stat-info">
                  <span className="stat-value">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>
    ),

    'features': () => (
      <section className="section-padding features-section" id="features-section" key="features">
        <div className="container">
          <ScrollReveal animation={anim.features} className="section-center">
            <div className="section-tag"><Award size={14} /> Tại Sao Chọn Chúng Tôi?</div>
            <h2 className="section-title">Công Cụ Bạn Sẽ <span className="highlight">Thành Thạo</span></h2>
            <p className="section-subtitle">Chương trình đào tạo bài bản, thực chiến 100% — giúp bạn làm chủ mọi công cụ văn phòng</p>
          </ScrollReveal>
          <StaggerReveal animation={anim.features} staggerDelay={150} className="grid-4 features-grid">
            {officeFeatures.map((f, i) => (
              <div key={i} className="feature-card-premium" style={{ '--accent': f.color }}>
                <div className="feature-icon-wrapper">
                  {f.icon.includes('.png') ? (
                    <img src={f.icon} alt={f.title} className="feature-3d-icon" />
                  ) : (
                    <div className="feature-icon-fallback"><Zap size={32} /></div>
                  )}
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <div className="feature-border" />
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>
    ),

    'learning-path': () => (
      <section className="section-padding learning-path-section" id="learning-path" key="learning-path">
        <div className="container">
          <ScrollReveal animation={anim.learningPath} className="section-center">
            <div className="section-tag"><Target size={14} /> Lộ Trình Học</div>
            <h2 className="section-title">Bắt Đầu Chỉ Với <span className="highlight">4 Bước</span></h2>
            <p className="section-subtitle">Quy trình học tập đơn giản, hiệu quả — ai cũng có thể bắt đầu</p>
          </ScrollReveal>
          <StaggerReveal animation={anim.learningPath} staggerDelay={200} className="path-grid">
            {learningPath.map((item, i) => (
              <div key={i} className="path-card">
                <div className="path-step">{item.step}</div>
                <div className="path-icon"><item.icon size={28} /></div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                {i < learningPath.length - 1 && <div className="path-connector" />}
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>
    ),

    'visual-learning': () => (
      <section className="section-padding visual-learning-section" id="visual-learning" key="visual-learning">
        <div className="container visual-grid">
          <ScrollReveal animation="fade-right" className="visual-image">
            <div className="visual-wrapper">
              {settings?.visual_media_url ? (
                (settings?.visual_media_type === 'video') ? (
                  <div style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    {settings.visual_media_url.includes('youtube') || settings.visual_media_url.includes('youtu.be') ? (
                      <iframe src={settings.visual_media_url.replace('watch?v=', 'embed/')} 
                        style={{ width: '100%', height: '100%', minHeight: '350px', border: 'none' }} title="Visual Learning Video" allowFullScreen />
                    ) : (
                      <VideoPlayer src={settings.visual_media_url} />
                    )}
                  </div>
                ) : (
                  <img src={settings.visual_media_url} alt="Visual Learning" />
                )
              ) : (
                <img src="/computer_usage_3d.png" alt="Computer Skills" />
              )}
              <div className="visual-glow-ai" />
            </div>
          </ScrollReveal>
          <ScrollReveal animation={anim.visual === 'fade-right' ? 'fade-left' : anim.visual} delay={200} className="visual-content">
            <div className="section-tag section-tag-ai">
              {settings?.visual_subtitle || '💻 Kỹ Năng Máy Tính 4.0'}
            </div>
            <h2 className="section-title text-left">
              {settings?.visual_title || <>Học Tập <span className="highlight-ai">Trực Quan</span> &amp; Thực Hành</>}
            </h2>
            <p className="v-desc">
              {settings?.visual_description || 'Làm chủ mọi thao tác trên máy tính, từ quản lý file chuyên nghiệp đến việc ứng dụng AI vào công việc hàng ngày của bạn.'}
            </p>
            <ul className="visual-features-list">
              {(() => {
                let vfList = [];
                try { vfList = JSON.parse(settings?.home_visual_features || '[]'); } catch(e) {}
                if (vfList.length === 0) {
                  vfList = [
                    { emoji: '📁', title: 'Quản Lý Dữ Liệu', desc: 'Sắp xếp khoa học, tìm kiếm nhanh và backup an toàn.' },
                    { emoji: '⚡', title: 'Tối Ưu Hiệu Suất', desc: 'Phím tắt, task manager, tối ưu Windows pro.' },
                    { emoji: '🤖', title: 'Trợ Lý AI', desc: 'Ứng dụng ChatGPT, Copilot & AI vào công việc.' },
                  ];
                }
                return vfList.map((vf, i) => (
                  <li key={i}>
                    <div className="v-icon-box">{vf.emoji}</div>
                    <div className="v-text">
                      <strong>{vf.title}</strong>
                      <p>{vf.desc}</p>
                    </div>
                  </li>
                ));
              })()}
            </ul>
            <Link to="/courses" className="btn btn-primary" style={{ marginTop: '2rem', width: 'fit-content' }}>
              Khám Phá Khóa Học <ArrowRight size={18} />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    ),

    'courses': () => (
      <section className="section-padding courses-section" id="courses-section" key="courses">
        <div className="container">
          <ScrollReveal animation="fade-up">
             <div className="section-header">
              <div>
                <div className="section-tag"><BookOpen size={14} /> {settings?.courses_tag || 'Khóa Học Nổi Bật'}</div>
                <h2 className="section-title">{settings?.courses_title || <>Khóa Học <span className="highlight">Được Yêu Thích</span></>}</h2>
                <p className="section-subtitle">{settings?.courses_subtitle || 'Chọn từ hàng chục khóa học chất lượng cao được thiết kế bởi chuyên gia hàng đầu'}</p>
              </div>
              <Link to="/courses" className="btn btn-outline">
                {settings?.courses_btn_text || 'Xem Tất Cả'} <ChevronRight size={16} />
              </Link>
            </div>
          </ScrollReveal>

          {loading ? (
            <div className="loader"><div className="spinner" /></div>
          ) : (
            <StaggerReveal animation="fade-up" staggerDelay={150} className="grid-3">
              {featuredCourses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </StaggerReveal>
          )}
        </div>
      </section>
    ),

    'testimonials': () => (
      <section className="section-padding testimonials-section" id="testimonials" key="testimonials">
        <div className="container">
          <ScrollReveal animation={anim.testimonials} className="section-center">
            <div className="section-tag"><MessageSquare size={14} /> Học Viên Nói Gì?</div>
            <h2 className="section-title">Phản Hồi <span className="highlight">Thực Tế</span> Từ Học Viên</h2>
            <p className="section-subtitle">Hàng nghìn học viên đã thay đổi sự nghiệp nhờ các khóa học tại Thắng Tin Học</p>
          </ScrollReveal>
          <StaggerReveal animation={anim.testimonials} staggerDelay={200} className="grid-3 testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-quote"><Quote size={28} /></div>
                <div className="testimonial-stars stars">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} fill={s <= t.rating ? '#f59e0b' : 'none'} color="#f59e0b" />
                  ))}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.name} className="author-avatar-img" />
                  ) : (
                    <div className="author-avatar">{t.name?.[0] || '?'}</div>
                  )}
                  <div>
                    <p className="author-name">{t.name}</p>
                    <p className="author-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>
    ),

    'partners': () => (
      <section className="section-padding partners-section" id="partners" key="partners">
        <div className="container">
          <ScrollReveal animation={anim.partners} className="section-center">
            <div className="section-tag"><Zap size={14} /> Đối Tác Chiến Lược</div>
            <h2 className="section-title">Đồng Hành Cùng <span className="highlight">Sự Thành Công</span></h2>
            <p className="section-subtitle">Chúng tôi hợp tác với các tập đoàn công nghệ và trường đại học hàng đầu</p>
          </ScrollReveal>
          <StaggerReveal animation={anim.partners} staggerDelay={100} className="partners-grid">
            {finalPartners.map((partner, i) => (
              <div key={i} className="partner-card">
                <img src={partner.logo} alt={partner.name} title={partner.name} />
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>
    ),

    'cta': () => (
      <section className="cta-section" id="cta-section" key="cta">
        <div className="cta-bg">
          <div className="cta-orb cta-orb1" />
          <div className="cta-orb cta-orb2" />
        </div>
        <ScrollReveal animation={anim.cta} className="container cta-content">
          <div className="cta-badge"><Sparkles size={14} /> Bắt Đầu Hành Trình</div>
          <h2 className="cta-title">
            {settings?.cta_title || <>Sẵn Sàng Nâng Cấp<br/><span>Kỹ Năng Tin Học?</span></>}
          </h2>
          <p className="cta-desc">
            {settings?.cta_subtitle || <>Đăng ký ngay hôm nay để nhận ưu đãi giảm 30% cho tất cả khóa học.<br/>Cơ hội có hạn — đừng bỏ lỡ!</>}
          </p>
          <div className="cta-actions">
            <Link to={settings?.cta_btn_url || '/register'} className="btn btn-primary btn-lg cta-btn">
              {settings?.cta_btn_text || 'Đăng Ký Ngay'} <ArrowRight size={20} />
            </Link>
            <Link to={settings?.cta_btn2_url || '/courses'} className="btn btn-ghost btn-lg">
              {settings?.cta_btn2_text || 'Xem Khóa Học'} <ChevronRight size={18} />
            </Link>
          </div>
        </ScrollReveal>
      </section>
    ),
  };

  return (
    <div className="home">
      {/* Render sections in dynamic order, skip hidden */}
      {visibleSections.map(sectionId => {
        const renderer = sectionRenderers[sectionId];
        if (renderer) return renderer();
        // Custom container rendering
        if (sectionId.startsWith('container-') && customSections[sectionId]) {
          const cs = customSections[sectionId];
          return (
            <section key={sectionId} id={sectionId} className="section-padding" style={{ background: cs.bgColor || '#0f172a' }}>
              <div className="container">
                <ScrollReveal animation="fade-up" className="section-center">
                  <h2 className="section-title">{cs.title}</h2>
                </ScrollReveal>
                <ScrollReveal animation="fade-up" delay={150}>
                  <div style={{ display: 'grid', gridTemplateColumns: cs.layout || '1fr 1fr', gap: '24px' }}>
                    {(cs.items || []).map((item, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '28px 24px', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.3s' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{item.icon || '📌'}</div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{item.title}</h3>
                        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                        {item.btnText && (
                          <Link to={item.btnUrl || '#'} className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>
                            {item.btnText} <ArrowRight size={16} />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollReveal>
              </div>
            </section>
          );
        }
        return null;
      })}


      {/* Promo Popup — CMS driven */}
      {showPromo && (
        <div className="promo-overlay" onClick={() => { setShowPromo(false); sessionStorage.setItem('promo_dismissed', '1'); }}>
          <div className="promo-popup" onClick={e => e.stopPropagation()}>
            <button className="promo-close" onClick={() => { setShowPromo(false); sessionStorage.setItem('promo_dismissed', '1'); }}>✕</button>
            {settings?.promo_image ? (
              <Link
                to={settings?.promo_link || '/courses'}
                onClick={() => { setShowPromo(false); sessionStorage.setItem('promo_dismissed', '1'); }}
              >
                <img src={settings.promo_image} alt={settings.promo_title || 'Khuyến mãi'} className="promo-image" />
              </Link>
            ) : (
              <div className="promo-html-content">
                {settings?.promo_title && <h3 className="promo-title">{settings.promo_title}</h3>}
                {settings?.promo_text && (
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(settings.promo_text) }} />
                )}
                {settings?.promo_link && (
                  <Link
                    to={settings.promo_link}
                    className="btn btn-primary"
                    style={{ marginTop: '16px', display: 'inline-flex' }}
                    onClick={() => { setShowPromo(false); sessionStorage.setItem('promo_dismissed', '1'); }}
                  >
                    Xem ngay
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Smart Section Navigator */}
      <button 
        className={`section-navigator ${showNav ? 'visible' : ''} ${isLastSection ? 'go-top' : ''}`}
        onClick={handleNavClick}
        aria-label={isLastSection ? 'Cuộn lên đầu trang' : 'Cuộn xuống phần tiếp'}
      >
        {isLastSection ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
      </button>
    </div>
  );
}

