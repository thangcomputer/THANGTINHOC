import { useState, useEffect } from 'react';
import { 
  Save, Globe, Phone, Mail, MapPin, Upload as UploadIcon,
  ExternalLink, Share2, Loader2, ImageIcon, Clock,
  Plus, Trash2, MoveUp, MoveDown, Link as LinkIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Loading from '../components/Loading';

// ── Preset social icons (SVG paths) ──
const SOCIAL_PRESETS = [
  { id: 'facebook',  label: 'Facebook',  color: '#1877f2', path: 'M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.271h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z', vb: '0 0 24 24' },
  { id: 'messenger', label: 'Messenger', color: '#a033ff', path: 'M12 0C5.373 0 0 4.975 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z', vb: '0 0 24 24' },
  { id: 'youtube',   label: 'YouTube',   color: '#ff0000', path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z', vb: '0 0 24 24' },
  { id: 'zalo',      label: 'Zalo',      color: '#0068ff', path: null, vb: '0 0 614.501 613.667', paths: [
    'M464.721,301.399c-13.984-0.014-23.707,11.478-23.944,28.312c-0.251,17.771,9.168,29.208,24.037,29.202c14.287-0.007,23.799-11.095,24.01-27.995C489.028,313.536,479.127,301.399,464.721,301.399z',
    'M291.83,301.392c-14.473-0.316-24.578,11.603-24.604,29.024c-0.02,16.959,9.294,28.259,23.496,28.502c15.072,0.251,24.592-10.87,24.539-28.707C315.214,313.318,305.769,301.696,291.83,301.392z',
    'M310.518,3.158C143.102,3.158,7.375,138.884,7.375,306.3s135.727,303.142,303.143,303.142c167.415,0,303.143-135.727,303.143-303.142S477.933,3.158,310.518,3.158z M217.858,391.083c-33.364,0.818-66.828,1.353-100.133-0.343c-21.326-1.095-27.652-18.647-14.248-36.583c21.55-28.826,43.886-57.065,65.792-85.621c2.546-3.305,6.214-5.996,7.15-12.705c-16.609,0-32.784,0.04-48.958-0.013c-19.195-0.066-28.278-5.805-28.14-17.652c0.132-11.768,9.175-17.329,28.397-17.348c25.159-0.026,50.324-0.06,75.476,0.026c9.637,0.033,19.604,0.105,25.304,9.789c6.22,10.561,0.284,19.512-5.646,27.454c-21.26,28.497-43.015,56.624-64.559,84.902c-2.599,3.41-5.119,6.88-9.453,12.725c23.424,0,44.123-0.053,64.816,0.026c8.674,0.026,16.662,1.873,19.941,11.267C237.892,379.329,231.368,390.752,217.858,391.083z M350.854,330.211c0,13.417-0.093,26.841,0.039,40.265c0.073,7.599-2.599,13.647-9.512,17.084c-7.296,3.642-14.71,3.028-20.304-2.968c-3.997-4.281-6.214-3.213-10.488-0.422c-17.955,11.728-39.908,9.96-56.597-3.866c-29.928-24.789-30.026-74.803-0.211-99.776c16.194-13.562,39.592-15.462,56.709-4.143c3.951,2.619,6.201,4.815,10.396-0.053c5.39-6.267,13.055-6.761,20.271-3.357c7.454,3.509,9.935,10.165,9.776,18.265C350.67,304.222,350.86,317.217,350.854,330.211z M395.617,369.579c-0.118,12.837-6.398,19.783-17.196,19.908c-10.779,0.132-17.593-6.966-17.646-19.512c-0.179-43.352-0.185-86.696,0.007-130.041c0.059-12.256,7.302-19.921,17.896-19.222c11.425,0.752,16.992,7.448,16.992,18.833c0,22.104,0,44.216,0,66.327C395.677,327.105,395.828,348.345,395.617,369.579z M463.981,391.868c-34.399-0.336-59.037-26.444-58.786-62.289c0.251-35.66,25.304-60.713,60.383-60.396c34.631,0.304,59.374,26.306,58.998,61.986C524.207,366.492,498.534,392.205,463.981,391.868z'
  ] },
  { id: 'tiktok',    label: 'TikTok',    color: '#010101', path: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z', vb: '0 0 24 24' },
  { id: 'instagram', label: 'Instagram', color: '#e1306c', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z', vb: '0 0 24 24' },
  { id: 'phone',     label: 'Điện thoại', color: '#22c55e', path: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z', vb: '0 0 24 24' },
];

function SocialIconPreview({ icon, size = 28 }) {
  const preset = SOCIAL_PRESETS.find(p => p.id === icon);
  if (!preset) return <span style={{ fontSize: '18px' }}>🔗</span>;
  return (
    <svg viewBox={preset.vb} width={size} height={size} fill="white">
      {preset.paths ? preset.paths.map((d, i) => <path key={i} d={d} />) : <path d={preset.path} />}
    </svg>
  );
}

const DEFAULT_SOCIAL_BUTTONS = [
  { id: 1, icon: 'facebook',  label: 'Facebook',  color: '#1877f2', url: '', show_footer: true,  show_chat: false },
  { id: 2, icon: 'youtube',   label: 'YouTube',   color: '#ff0000', url: '', show_footer: true,  show_chat: false },
  { id: 3, icon: 'zalo',      label: 'Zalo',      color: '#0068ff', url: '', show_footer: true,  show_chat: true  },
  { id: 4, icon: 'messenger', label: 'Messenger', color: '#a033ff', url: '', show_footer: false, show_chat: true  },
];

export default function Settings() {
  const [settings, setSettings] = useState({
    site_name: 'Thắng Tin Học',
    site_description: 'Nền tảng đào tạo tin học văn phòng chuyên nghiệp',
    contact_email: 'contact@thangtinhoc.vn',
    contact_phone: '0987-654-321',
    address: '123 Đường Tin Học, Quận 1, TP.HCM',
    facebook_url: '',
    youtube_url: '',
    zalo_url: '',
    tiktok_url: '',
    site_logo: '',
    footer_text: '© 2026 Thắng Tin Học',
    footer_hours_weekday: 'Thứ 2 - Thứ 7: 8:00 - 21:00',
    footer_hours_weekend: 'Chủ Nhật: 8:00 - 17:00',
  });
  const [socialButtons, setSocialButtons] = useState(DEFAULT_SOCIAL_BUTTONS);
  const [chatPages, setChatPages] = useState(['all']); // 'all' or array of paths
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general');

  const scrollToSection = (id) => {
    setSettingsTab(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const PAGE_OPTIONS = [
    { path: '/',            label: '🏠 Trang Chủ' },
    { path: '/courses',     label: '📚 Khóa Học' },
    { path: '/blog',        label: '📝 Blog' },
    { path: '/gioi-thieu',  label: 'ℹ️ Giới Thiệu' },
    { path: '/lien-he',     label: '📞 Liên Hệ' },
    { path: '/tuyen-dung',  label: '👔 Tuyển Dụng' },
  ];

  const toggleChatPage = (path) => {
    if (path === 'all') {
      // Toggle: bỏ tick 'all' → chuyển sang chọn từng trang
      setChatPages(chatPages.includes('all') ? [] : ['all']);
      return;
    }
    const filtered = chatPages.filter(p => p !== 'all');
    if (filtered.includes(path)) {
      setChatPages(filtered.filter(p => p !== path));
    } else {
      setChatPages([...filtered, path]);
    }
  };

  useEffect(() => {
    api.get('/settings').then(res => {
      if (Object.keys(res.data.data).length > 0) {
        setSettings(prev => ({ ...prev, ...res.data.data }));
        if (res.data.data.social_buttons) {
          try { setSocialButtons(JSON.parse(res.data.data.social_buttons)); } catch {}
        }
        if (res.data.data.chat_widget_pages) {
          try { setChatPages(JSON.parse(res.data.data.chat_widget_pages)); } catch {}
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/settings/bulk', { settings: { ...settings, social_buttons: JSON.stringify(socialButtons), chat_widget_pages: JSON.stringify(chatPages) } });
      toast.success('Cập nhật cấu hình thành công!');
    } catch {
      toast.error('Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post('/upload', formData);
      setSettings({ ...settings, site_logo: res.data.data.url });
      toast.success('Đã tải lên Logo mới!');
    } catch {
      toast.error('Lỗi khi tải ảnh');
    }
  };

  // Social button CRUD
  const addSocialBtn = () => {
    setSocialButtons(prev => [...prev, { id: Date.now(), icon: 'facebook', label: 'Mới', color: '#6366f1', url: '', show_footer: true, show_chat: false }]);
  };
  const removeSocialBtn = (id) => setSocialButtons(prev => prev.filter(b => b.id !== id));
  const updateSocialBtn = (id, field, value) => setSocialButtons(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  const moveSocialBtn = (idx, dir) => {
    const arr = [...socialButtons];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setSocialButtons(arr);
  };

  if (loading) return <Loading fullPage message="Đang tải cấu hình..." />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Cài đặt hệ thống</h1>
          <p>Cấu hình thông tin cơ bản cho toàn website</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="settings-layout">
          <nav className="settings-nav" aria-label="Mục cài đặt">
            {[
              { id: 'settings-general', label: 'Thông tin chung' },
              { id: 'settings-social', label: 'Mạng xã hội' },
              { id: 'settings-footer', label: 'Footer' },
              { id: 'settings-tech', label: 'Kỹ thuật' },
            ].map((t) => (
              <button key={t.id} type="button" className={settingsTab === t.id ? 'active' : ''} onClick={() => scrollToSection(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" id="settings-general">
              <div className="card-header">
                <h3 className="card-title">Thông tin website</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label><Globe size={14} /> Tên Website</label>
                  <input type="text" className="form-control" required value={settings.site_name} onChange={e => setSettings({...settings, site_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Mô tả (SEO)</label>
                  <textarea className="form-control" rows="3" value={settings.site_description} onChange={e => setSettings({...settings, site_description: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label><Mail size={14} /> Email Liên Hệ</label>
                    <input type="email" className="form-control" value={settings.contact_email} onChange={e => setSettings({...settings, contact_email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label><Phone size={14} /> Số Điện Thoại</label>
                    <input type="text" className="form-control" value={settings.contact_phone} onChange={e => setSettings({...settings, contact_phone: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label><MapPin size={14} /> Địa Chỉ</label>
                  <input type="text" className="form-control" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} />
                </div>
              </div>
            </div>

            {/* ── Social Buttons Manager ── */}
            <div className="card" id="settings-social">
              <div className="card-header">
                <h3 className="card-title"><Share2 size={16} /> Nút mạng xã hội</h3>
                <button type="button" className="btn btn-primary btn-sm" onClick={addSocialBtn}>
                  <Plus size={14} /> Thêm nút
                </button>
              </div>
              <div className="card-body">
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Quản lý các nút mạng xã hội hiển thị ở Footer và Chat Widget. Bật/tắt từng vị trí bằng checkbox.
                </p>
                {socialButtons.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '2px dashed var(--border)' }}>
                    <Share2 size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Chưa có nút nào. Bấm "+ Thêm nút" để tạo.</p>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {socialButtons.map((btn, idx) => (
                    <div key={btn.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '12px', alignItems: 'center', padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      {/* Preview */}
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: btn.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${btn.color}55` }}>
                        <SocialIconPreview icon={btn.icon} color={btn.color} size={22} />
                      </div>

                      {/* Fields */}
                      <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr 100px', gap: '8px', alignItems: 'center' }}>
                        {/* Icon picker */}
                        <select className="form-control" style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                          value={btn.icon} onChange={e => {
                            const preset = SOCIAL_PRESETS.find(p => p.id === e.target.value);
                            updateSocialBtn(btn.id, 'icon', e.target.value);
                            if (preset) {
                              updateSocialBtn(btn.id, 'label', preset.label);
                              updateSocialBtn(btn.id, 'color', preset.color);
                            }
                          }}>
                          {SOCIAL_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                        {/* URL */}
                        <input type="text" className="form-control" style={{ fontSize: '0.8rem' }}
                          placeholder="https://..." value={btn.url}
                          onChange={e => updateSocialBtn(btn.id, 'url', e.target.value)} />
                        {/* Color */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input type="color" value={btn.color} onChange={e => updateSocialBtn(btn.id, 'color', e.target.value)}
                            style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Màu</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button type="button" className="btn btn-icon btn-sm" onClick={() => moveSocialBtn(idx, -1)} disabled={idx === 0}><MoveUp size={12} /></button>
                          <button type="button" className="btn btn-icon btn-sm" onClick={() => moveSocialBtn(idx, 1)} disabled={idx === socialButtons.length - 1}><MoveDown size={12} /></button>
                          <button type="button" className="btn btn-icon btn-sm" onClick={() => removeSocialBtn(btn.id)} style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>
                        </div>
                        {/* Position toggles */}
                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            <input type="checkbox" checked={btn.show_footer} onChange={e => updateSocialBtn(btn.id, 'show_footer', e.target.checked)} />
                            Footer
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            <input type="checkbox" checked={btn.show_chat} onChange={e => updateSocialBtn(btn.id, 'show_chat', e.target.checked)} />
                            Chat
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Chat Widget Page Selector ── */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">💬 Chat Widget — Chọn Trang Hiển Thị</h3>
              </div>
              <div className="card-body">
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Chọn trang nào sẽ hiện nút Chat Widget (Tư Vấn Trực Tuyến) ở góc màn hình.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 12px', borderRadius: 'var(--radius)', background: chatPages.includes('all') ? 'rgba(99,102,241,0.12)' : 'var(--bg-subtle)', border: `1px solid ${chatPages.includes('all') ? 'var(--primary)' : 'var(--border)'}`, fontWeight: 600 }}>
                    <input type="checkbox" checked={chatPages.includes('all')} onChange={() => toggleChatPage('all')} />
                    🌐 Tất cả trang
                  </label>
                  {!chatPages.includes('all') && PAGE_OPTIONS.map(page => (
                    <label key={page.path} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 12px', borderRadius: 'var(--radius)', background: chatPages.includes(page.path) ? 'rgba(99,102,241,0.08)' : 'var(--bg-subtle)', border: `1px solid ${chatPages.includes(page.path) ? 'rgba(99,102,241,0.4)' : 'var(--border)'}` }}>
                      <input type="checkbox" checked={chatPages.includes(page.path)} onChange={() => toggleChatPage(page.path)} />
                      {page.label}
                      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{page.path}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title" id="settings-footer">Chân trang (Footer)</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label>Copyright Text</label>
                  <input type="text" className="form-control" value={settings.footer_text} onChange={e => setSettings({...settings, footer_text: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label><Clock size={14} /> Giờ làm (Ngày thường)</label>
                    <input type="text" className="form-control" value={settings.footer_hours_weekday} onChange={e => setSettings({...settings, footer_hours_weekday: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label><Clock size={14} /> Giờ làm (Cuối tuần)</label>
                    <input type="text" className="form-control" value={settings.footer_hours_weekend} onChange={e => setSettings({...settings, footer_hours_weekend: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Logo & Nhận Diện</h3>
              </div>
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '20px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  {settings.site_logo ? (
                    <img src={settings.site_logo} alt="Logo" style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <ImageIcon size={36} style={{ opacity: 0.3 }} />
                      <span style={{ fontSize: '0.8rem' }}>Chưa có logo</span>
                    </div>
                  )}
                </div>
                <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                  <UploadIcon size={14} /> Thay Đổi Logo
                  <input type="file" hidden accept="image/*,.webp" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Tích hợp & SEO</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label>📊 Google Analytics ID</label>
                  <input type="text" className="form-control" placeholder="G-XXXXXXXXXX" value={settings.google_analytics_id || ''} onChange={e => setSettings({...settings, google_analytics_id: e.target.value})} />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Lấy từ Google Analytics → Admin → Data Streams</small>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>🗺️ Google Maps Embed URL</label>
                  <input type="text" className="form-control" placeholder="https://www.google.com/maps/embed?pb=..." value={settings.google_maps_embed || ''} onChange={e => setSettings({...settings, google_maps_embed: e.target.value})} />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Google Maps → Chia sẻ → Nhúng bản đồ → Copy src="..."</small>
                </div>
              </div>
            </div>

            {/* ── Loading Mode ── */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">⚡ Chế độ loading</h3>
              </div>
              <div className="card-body">
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Chọn kiểu hiệu ứng loading khi tải trang web
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  {[
                    { id: 'spinner', label: '🌀 Vòng Xoay Gradient', desc: 'Hai vòng xoay ngược chiều + dot pulse' },
                    { id: 'pulse', label: '💜 Logo Pulse', desc: 'Logo phát sóng ripple, chuyên nghiệp' },
                    { id: 'dots', label: '⚫ Chấm Nhảy', desc: '5 chấm tròn nhảy lên xuống' },
                    { id: 'wave', label: '🎵 Sóng Equalizer', desc: '7 thanh sóng nhạc động' },
                    { id: 'progress', label: '📊 Thanh Tiến Trình', desc: 'Progress bar + phần trăm' },
                  ].map(mode => (
                    <label key={mode.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                      border: `2px solid ${(settings.loading_mode || 'spinner') === mode.id ? 'var(--primary)' : 'var(--border)'}`,
                      background: (settings.loading_mode || 'spinner') === mode.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      <input type="radio" name="loading_mode" value={mode.id}
                        checked={(settings.loading_mode || 'spinner') === mode.id}
                        onChange={() => setSettings({ ...settings, loading_mode: mode.id })}
                        style={{ accentColor: '#6366f1', width: '16px', height: '16px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{mode.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{mode.desc}</div>
                      </div>
                      {(settings.loading_mode || 'spinner') === mode.id && (
                        <span style={{ fontSize: '0.68rem', padding: '2px 10px', borderRadius: '99px', background: 'var(--primary)', color: '#fff', fontWeight: 700 }}>
                          ĐANG DÙNG
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Xem trước nút</h3>
              </div>
              <div className="card-body">
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Footer:</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {socialButtons.filter(b => b.show_footer).map(btn => (
                    <div key={btn.id} style={{ width: '38px', height: '38px', borderRadius: '8px', background: btn.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${btn.color}66`, title: btn.label }}>
                      <SocialIconPreview icon={btn.icon} size={18} />
                    </div>
                  ))}
                  {socialButtons.filter(b => b.show_footer).length === 0 && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Chưa có nút cho Footer</span>}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Chat Widget:</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {socialButtons.filter(b => b.show_chat).map(btn => (
                    <div key={btn.id} style={{ width: '44px', height: '44px', borderRadius: '50%', background: btn.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${btn.color}66` }}>
                      <SocialIconPreview icon={btn.icon} size={22} />
                    </div>
                  ))}
                  {socialButtons.filter(b => b.show_chat).length === 0 && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Chưa có nút cho Chat Widget</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Sticky Save Button */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', position: 'sticky', bottom: '24px', zIndex: 10 }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving} style={{ boxShadow: 'var(--shadow-xl)' }}>
            {saving ? <><Loader2 size={18} className="spinner" /> Đang lưu...</> : <><Save size={18} /> Lưu Cài Đặt</>}
          </button>
        </div>
      </form>
    </div>
  );
}
