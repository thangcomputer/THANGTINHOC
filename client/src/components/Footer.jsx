import { Link } from 'react-router-dom';
import { BookOpen, Phone, Mail, MapPin } from 'lucide-react';
import './Footer.css';

// Render icon đúng theo id từ admin social_buttons
function SocialSvg({ icon }) {
  if (icon === 'zalo') return (
    <svg viewBox="0 0 614.501 613.667" width="22" height="22" fill="white">
      <path d="M464.721,301.399c-13.984-0.014-23.707,11.478-23.944,28.312c-0.251,17.771,9.168,29.208,24.037,29.202c14.287-0.007,23.799-11.095,24.01-27.995C489.028,313.536,479.127,301.399,464.721,301.399z"/>
      <path d="M291.83,301.392c-14.473-0.316-24.578,11.603-24.604,29.024c-0.02,16.959,9.294,28.259,23.496,28.502c15.072,0.251,24.592-10.87,24.539-28.707C315.214,313.318,305.769,301.696,291.83,301.392z"/>
      <path d="M310.518,3.158C143.102,3.158,7.375,138.884,7.375,306.3s135.727,303.142,303.143,303.142c167.415,0,303.143-135.727,303.143-303.142S477.933,3.158,310.518,3.158z M217.858,391.083c-33.364,0.818-66.828,1.353-100.133-0.343c-21.326-1.095-27.652-18.647-14.248-36.583c21.55-28.826,43.886-57.065,65.792-85.621c2.546-3.305,6.214-5.996,7.15-12.705c-16.609,0-32.784,0.04-48.958-0.013c-19.195-0.066-28.278-5.805-28.14-17.652c0.132-11.768,9.175-17.329,28.397-17.348c25.159-0.026,50.324-0.06,75.476,0.026c9.637,0.033,19.604,0.105,25.304,9.789c6.22,10.561,0.284,19.512-5.646,27.454c-21.26,28.497-43.015,56.624-64.559,84.902c-2.599,3.41-5.119,6.88-9.453,12.725c23.424,0,44.123-0.053,64.816,0.026c8.674,0.026,16.662,1.873,19.941,11.267C237.892,379.329,231.368,390.752,217.858,391.083z M350.854,330.211c0,13.417-0.093,26.841,0.039,40.265c0.073,7.599-2.599,13.647-9.512,17.084c-7.296,3.642-14.71,3.028-20.304-2.968c-3.997-4.281-6.214-3.213-10.488-0.422c-17.955,11.728-39.908,9.96-56.597-3.866c-29.928-24.789-30.026-74.803-0.211-99.776c16.194-13.562,39.592-15.462,56.709-4.143c3.951,2.619,6.201,4.815,10.396-0.053c5.39-6.267,13.055-6.761,20.271-3.357c7.454,3.509,9.935,10.165,9.776,18.265C350.67,304.222,350.86,317.217,350.854,330.211z M395.617,369.579c-0.118,12.837-6.398,19.783-17.196,19.908c-10.779,0.132-17.593-6.966-17.646-19.512c-0.179-43.352-0.185-86.696,0.007-130.041c0.059-12.256,7.302-19.921,17.896-19.222c11.425,0.752,16.992,7.448,16.992,18.833c0,22.104,0,44.216,0,66.327C395.677,327.105,395.828,348.345,395.617,369.579z M463.981,391.868c-34.399-0.336-59.037-26.444-58.786-62.289c0.251-35.66,25.304-60.713,60.383-60.396c34.631,0.304,59.374,26.306,58.998,61.986C524.207,366.492,498.534,392.205,463.981,391.868z"/>
    </svg>
  );
  if (icon === 'messenger') return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
      <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z"/>
    </svg>
  );
  if (icon === 'facebook') return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.271h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
  if (icon === 'youtube') return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
  if (icon === 'tiktok') return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
    </svg>
  );
  if (icon === 'instagram') return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
  if (icon === 'phone') return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
  );
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><circle cx="12" cy="12" r="10"/></svg>;
}

export default function Footer({ settings }) {
  let customCols = [];
  if (settings?.footer_columns) {
    try { customCols = JSON.parse(settings.footer_columns); } catch { customCols = []; }
  }

  // Lấy nút social từ social_buttons (cùng nguồn với admin)
  let footerBtns = [];
  try { footerBtns = JSON.parse(settings?.social_buttons || '[]').filter(b => b.show_footer && b.url); } catch {}

  const bName = settings?.site_name || 'Thắng Tin Học';
  const bDesc = settings?.site_description || 'Trung tâm đào tạo tin học văn phòng chuyên nghiệp.';
  const cAddress = settings?.address || '123 Đường Tin Học, Quận 1, TP.HCM';
  const cPhone = settings?.contact_phone || '0901 234 567';
  const cEmail = settings?.contact_email || 'info@thangtinhoc.vn';
  const hWd = settings?.footer_hours_weekday || 'Thứ 2 - Thứ 7: 8:00 - 21:00';
  const hWe = settings?.footer_hours_weekend || 'Chủ Nhật: 8:00 - 17:00';
  const copyright = settings?.footer_text || `© ${new Date().getFullYear()} Thắng Tin Học.`;
  const logo = settings?.site_logo;

  return (
    <footer className="footer">
      <div className="footer-wave" />
      <div className="container">
        <div className="footer-grid">

          {/* Cột Thương Hiệu */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              {logo ? (
                <img src={logo} alt={bName} style={{ height: '40px', objectFit: 'contain' }} />
              ) : (
                <>
                  <div className="brand-icon-sm"><BookOpen size={20} /></div>
                  <div><p className="footer-brand-name">{bName}</p></div>
                </>
              )}
            </Link>
            <p className="footer-desc">{bDesc}</p>

            {/* Social Buttons — đọc từ admin social_buttons */}
            <div className="social-links">
              {footerBtns.map(btn => (
                <a key={btn.id} href={btn.url} target="_blank" rel="noreferrer"
                  title={btn.label} className="social-btn"
                  style={{ background: btn.color }}>
                  <SocialSvg icon={btn.icon} />
                </a>
              ))}
            </div>
          </div>

          {/* Các Cột Menu Động */}
          {customCols.length > 0 ? (
            customCols.map((col, idx) => (
              <div key={idx} className="footer-col">
                <h4>{col.title}</h4>
                <ul>
                  {col.links && col.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      {link.url.startsWith('http') ? (
                        <a href={link.url} target="_blank" rel="noreferrer">{link.text}</a>
                      ) : (
                        <Link to={link.url}>{link.text}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <>
              <div className="footer-col">
                <h4>Khóa Học</h4>
                <ul>
                  <li><Link to="/courses">Tin Học Văn Phòng Cơ Bản</Link></li>
                  <li><Link to="/courses">Excel Nâng Cao</Link></li>
                  <li><Link to="/courses">Word Chuyên Nghiệp</Link></li>
                  <li><Link to="/courses">PowerPoint &amp; Thuyết Trình</Link></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Liên Kết</h4>
                <ul>
                  <li><Link to="/">Trang Chủ</Link></li>
                  <li><Link to="/gioi-thieu">Giới Thiệu</Link></li>
                  <li><Link to="/courses">Khóa Học</Link></li>
                  <li><Link to="/blog">Blog</Link></li>
                  <li><Link to="/tuyen-dung">Tuyển Dụng</Link></li>
                  <li><Link to="/lien-he">Liên Hệ</Link></li>
                </ul>
              </div>
            </>
          )}

          {/* Cột Liên Hệ */}
          <div className="footer-col">
            <h4>Liên Hệ</h4>
            <div className="contact-list">
              <div className="contact-item"><MapPin size={16} /><span>{cAddress}</span></div>
              <div className="contact-item"><Phone size={16} /><a href={`tel:${cPhone.replace(/\s/g, '')}`}>{cPhone}</a></div>
              <div className="contact-item"><Mail size={16} /><a href={`mailto:${cEmail}`}>{cEmail}</a></div>
            </div>
            <div className="office-hours">
              <p className="oh-title">Giờ Làm Việc</p>
              <p>{hWd}</p>
              <p>{hWe}</p>
            </div>
          </div>

        </div>

        <div className="footer-bottom">
          <p>{copyright}</p>
          <div className="footer-bottom-links">
            <span>Được xây dựng với 💖 tại Việt Nam</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
