import { useState, useEffect } from 'react';
import { 
  Save, Plus, Trash2, Layout, Award, Quote, BarChart, 
  Monitor, Loader2, GripVertical, Sparkles, Image as ImageIcon,
  ChevronDown, ChevronUp, Eye, EyeOff, Type, Link as LinkIcon, Columns,
  Target, Handshake, Megaphone, BookOpen, Laptop, ArrowRight,
  Palette, Zap, MoveUp, MoveDown, RefreshCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Loading from '../components/Loading';
import VisualBuilder from '../components/VisualBuilder';

const TABS = [
  { id: 'hero', label: 'Hero Banner', icon: Layout, desc: 'Banner chính & nội dung chào đón' },
  { id: 'stats', label: 'Thống Kê', icon: BarChart, desc: 'Số liệu ấn tượng trên trang chủ' },
  { id: 'features', label: 'Tính Năng', icon: Monitor, desc: 'Các công cụ & kỹ năng nổi bật' },
  { id: 'learning-path', label: 'Lộ Trình', icon: Target, desc: '4 bước học tập cho học viên' },
  { id: 'visual-learning', label: 'Học Trực Quan', icon: Laptop, desc: 'Phần kỹ năng máy tính 4.0' },
  { id: 'courses', label: 'Khóa Học', icon: BookOpen, desc: 'Phần khóa học nổi bật trên trang chủ' },
  { id: 'testimonials', label: 'Cảm Nhận', icon: Quote, desc: 'Đánh giá của học viên' },
  { id: 'partners', label: 'Đối Tác', icon: Handshake, desc: 'Logo & tên đối tác chiến lược' },
  { id: 'cta', label: 'CTA', icon: Megaphone, desc: 'Phần kêu gọi hành động cuối trang' },
  { id: 'promo', label: 'Khuyến Mãi', icon: Award, desc: 'Popup quảng bá' },
  { id: 'footer', label: 'Chân Trang', icon: Columns, desc: 'Cấu hình Footer' },
];

const ICON_OPTIONS = [
  'Zap', 'Shield', 'Award', 'Users', 'Clock', 'Star', 'Heart', 'BookOpen',
  'Monitor', 'Smartphone', 'Globe', 'Code', 'Database', 'Lock', 'Rocket',
  'Target', 'TrendingUp', 'CheckCircle', 'Layers', 'Command', 'GraduationCap',
];

const ANIMATION_OPTIONS = [
  { value: 'fade-up', label: '↑ Hiện lên từ dưới (Fade Up)' },
  { value: 'fade-down', label: '↓ Hiện xuống từ trên (Fade Down)' },
  { value: 'fade-left', label: '← Trượt từ phải (Fade Left)' },
  { value: 'fade-right', label: '→ Trượt từ trái (Fade Right)' },
  { value: 'zoom-in', label: '🔍 Phóng to (Zoom In)' },
  { value: 'flip-up', label: '🔄 Lật từ dưới (Flip Up)' },
  { value: 'none', label: '⛔ Không hiệu ứng' },
];

// ── Course Featured Picker ──
function CourseFeaturePicker() {
  const [allCourses, setAllCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [toggling, setToggling] = useState(null);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await api.get('/courses?limit=100');
      setAllCourses(res.data.data || []);
    } catch { toast.error('Lỗi tải danh sách khóa học'); }
    finally { setLoadingCourses(false); }
  };

  useEffect(() => { fetchCourses(); }, []);

  const toggleFeatured = async (course) => {
    setToggling(course.id);
    try {
      await api.put(`/courses/${course.id}`, {
        ...course,
        isFeatured: !course.isFeatured,
        categoryId: course.categoryId || course.category_id || 1,
      });
      setAllCourses(prev => prev.map(c => c.id === course.id ? { ...c, isFeatured: !c.isFeatured } : c));
      toast.success(course.isFeatured ? `Đã bỏ nổi bật: ${course.title}` : `Đã thêm nổi bật: ${course.title}`);
    } catch(err) { toast.error('Lỗi cập nhật khóa học'); console.error(err); }
    finally { setToggling(null); }
  };

  const featured = allCourses.filter(c => c.isFeatured);
  const available = allCourses.filter(c => !c.isFeatured);

  if (loadingCourses) return <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải khóa học...</div>;

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Featured courses */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
          ⭐ Khóa học nổi bật trên trang chủ ({featured.length})
        </div>
      </div>

      {featured.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '2px dashed var(--border)', marginBottom: '16px', color: 'var(--text-muted)' }}>
          <BookOpen size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Chưa có khóa học nổi bật. Bấm <strong>+</strong> bên dưới để thêm.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
          {featured.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--primary)', boxShadow: '0 0 0 1px rgba(99,102,241,0.1)' }}>
              {c.thumbnail ? (
                <img src={c.thumbnail} alt="" style={{ width: '56px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '56px', height: '40px', borderRadius: '6px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={16} style={{ color: 'var(--text-muted)' }} /></div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                  <span>{c.price?.toLocaleString() || '0'} đ</span>
                  {c.level && <span>• {c.level}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(99,102,241,0.1)', padding: '3px 10px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary)' }}>
                ⭐ Nổi bật
              </div>
              <button onClick={() => toggleFeatured(c)} disabled={toggling === c.id}
                style={{ background: 'none', border: '1px solid var(--danger)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', opacity: toggling === c.id ? 0.5 : 1 }}>
                <Trash2 size={12} /> Bỏ
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Available courses to add */}
      {available.length > 0 && (
        <>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Thêm khóa học nổi bật ({available.length} có sẵn)
          </div>
          <div style={{ display: 'grid', gap: '6px' }}>
            {available.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', transition: 'all 0.15s' }}>
                {c.thumbnail ? (
                  <img src={c.thumbnail} alt="" style={{ width: '48px', height: '34px', borderRadius: '5px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '48px', height: '34px', borderRadius: '5px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={14} style={{ color: 'var(--text-muted)' }} /></div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{c.price?.toLocaleString() || '0'} đ</div>
                </div>
                <button onClick={() => toggleFeatured(c)} disabled={toggling === c.id}
                  style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: toggling === c.id ? 0.5 : 1, transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}
                  title="Thêm vào nổi bật">
                  <Plus size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {allCourses.length === 0 && (
        <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '2px dashed var(--border)', color: 'var(--text-muted)' }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.85rem' }}>Chưa có khóa học nào trong hệ thống.</p>
          <a href="/courses" className="btn btn-primary btn-sm">Tạo khóa học mới →</a>
        </div>
      )}
    </div>
  );
}

// ─── SectionCard (outside HomeEditor to prevent re-mount) ───
const SectionCard = ({ title, children, count, onAdd, addText, icon: Icon }) => (
  <div className="card" style={{ marginBottom: '20px' }}>
    <div className="card-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {Icon && <Icon size={18} style={{ color: 'var(--primary)' }} />}
        <h3 className="card-title">{title}</h3>
        {count !== undefined && (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'var(--primary-bg)', color: 'var(--primary)', padding: '2px 10px', borderRadius: '99px' }}>
            {count}
          </span>
        )}
      </div>
      {onAdd && (
        <button className="btn btn-outline btn-sm" onClick={onAdd}>
          <Plus size={16} /> {addText || 'Thêm mới'}
        </button>
      )}
    </div>
    <div className="card-body">{children}</div>
  </div>
);

// ─── ItemCard (outside HomeEditor to prevent re-mount) ───
const ItemCard = ({ index, label, onRemove, onMoveUp, onMoveDown, total, children }) => (
  <div className="cms-section-card" style={{ position: 'relative' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label} #{index + 1}
      </span>
      <div style={{ display: 'flex', gap: '4px' }}>
        {onMoveUp && index > 0 && (
          <button className="btn btn-icon btn-sm" onClick={onMoveUp} title="Di chuyển lên"><MoveUp size={13} /></button>
        )}
        {onMoveDown && index < total - 1 && (
          <button className="btn btn-icon btn-sm" onClick={onMoveDown} title="Di chuyển xuống"><MoveDown size={13} /></button>
        )}
        <button className="btn btn-icon btn-sm" onClick={onRemove} style={{ color: 'var(--danger)' }} title="Xóa">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
    {children}
  </div>
);

// ─── AnimPicker (outside HomeEditor, receives settings+updateSetting as props) ───
const AnimPicker = ({ settingKey, label, settings, updateSetting }) => (
  <div className="card" style={{ marginBottom: '20px' }}>
    <div className="card-body" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
          <Palette size={16} style={{ color: 'var(--primary)', opacity: 0.7 }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Hiệu ứng cuộn: {label}
          </span>
        </div>
        <select
          className="form-control"
          value={settings[settingKey] || 'fade-up'}
          onChange={e => updateSetting(settingKey, e.target.value)}
          style={{ maxWidth: '320px', fontSize: '0.85rem' }}
        >
          {ANIMATION_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  </div>
);

export default function HomeEditor() {
  const [activeTab, setActiveTab] = useState('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [settings, setSettings] = useState({
    hero_title: '', hero_subtitle: '', hero_btn_text: '', hero_btn_url: '',
    home_features: '[]', home_testimonials: '[]', home_stats: '[]',
    home_partners: '[]', home_learning_path: '[]', home_visual_features: '[]',
    cta_title: '', cta_subtitle: '', cta_btn_text: '', cta_btn_url: '',
    cta_btn2_text: '', cta_btn2_url: '',
    visual_title: '', visual_subtitle: '', visual_description: '',
    courses_title: '', courses_subtitle: '', courses_btn_text: '',
    promo_enabled: 'false', promo_text: '', promo_title: '',
    footer_columns: '[]',
    // Animation settings per section
    anim_hero: 'fade-up', anim_stats: 'fade-up', anim_features: 'fade-up',
    anim_learning_path: 'fade-up', anim_visual: 'fade-right',
    anim_testimonials: 'fade-up', anim_partners: 'zoom-in',
    anim_cta: 'fade-up',
  });

  const [features, setFeatures] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [stats, setStats] = useState([]);
  const [partners, setPartners] = useState([]);
  const [learningPath, setLearningPath] = useState([]);
  const [visualFeatures, setVisualFeatures] = useState([]);
  const [footerColumns, setFooterColumns] = useState([]);
  const [customSections, setCustomSections] = useState({});
  const [viewMode, setViewMode] = useState('tabs'); // 'tabs' | 'visual'

  // Elementor-style section management
  const DEFAULT_SECTIONS = ['hero', 'stats', 'features', 'learning-path', 'visual-learning', 'courses', 'testimonials', 'partners', 'cta'];
  const [sectionOrder, setSectionOrder] = useState(DEFAULT_SECTIONS);
  const [sectionVisibility, setSectionVisibility] = useState({});
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const SECTION_META = {
    'hero': { label: 'Hero Banner', emoji: '✨', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' },
    'stats': { label: 'Thống Kê', emoji: '📊', color: '#6366f1', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' },
    'features': { label: 'Tính Năng', emoji: '🏆', color: '#f59e0b', gradient: '#0f172a' },
    'learning-path': { label: 'Lộ Trình Học', emoji: '🎯', color: '#10b981', gradient: '#0f172a' },
    'visual-learning': { label: 'Học Trực Quan', emoji: '💻', color: '#3b82f6', gradient: '#0f172a' },
    'courses': { label: 'Khóa Học Nổi Bật', emoji: '📚', color: '#8b5cf6', gradient: '#0f172a' },
    'testimonials': { label: 'Cảm Nhận', emoji: '💬', color: '#ec4899', gradient: '#0f172a' },
    'partners': { label: 'Đối Tác', emoji: '🤝', color: '#eab308', gradient: '#0f172a' },
    'cta': { label: 'Kêu Gọi Hành Động', emoji: '🚀', color: '#7c3aed', gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
  };

  const toggleSectionVisibility = (sectionId) => {
    setSectionVisibility(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    markChanged();
  };

  const handleDragStart = (idx) => setDraggedIdx(idx);
  const handleDragOver = (e, idx) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDragEnd = () => { setDraggedIdx(null); setDragOverIdx(null); };
  const handleDrop = (dropIdx) => {
    if (draggedIdx === null || draggedIdx === dropIdx) return;
    const newOrder = [...sectionOrder];
    const [moved] = newOrder.splice(draggedIdx, 1);
    newOrder.splice(dropIdx, 0, moved);
    setSectionOrder(newOrder);
    setDraggedIdx(null);
    setDragOverIdx(null);
    markChanged();
  };

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      const data = res.data.data;
      setSettings(prev => ({ ...prev, ...data }));
      try { setFeatures(JSON.parse(data.home_features || '[]')); } catch { setFeatures([]); }
      try { setTestimonials(JSON.parse(data.home_testimonials || '[]')); } catch { setTestimonials([]); }
      try { setStats(JSON.parse(data.home_stats || '[]')); } catch { setStats([]); }
      try { setPartners(JSON.parse(data.home_partners || '[]')); } catch { setPartners([]); }
      try { setLearningPath(JSON.parse(data.home_learning_path || '[]')); } catch { setLearningPath([]); }
      try { setVisualFeatures(JSON.parse(data.home_visual_features || '[]')); } catch { setVisualFeatures([]); }
      try { setFooterColumns(JSON.parse(data.footer_columns || '[]')); } catch { setFooterColumns([]); }
      try { const o = JSON.parse(data.section_order || '[]'); if (o.length > 0) setSectionOrder(o); } catch {}
      try { const v = JSON.parse(data.section_visibility || '{}'); setSectionVisibility(v); } catch {}
      try { setCustomSections(JSON.parse(data.custom_sections || '{}')); } catch { setCustomSections({}); }
    } catch {
      toast.error('Lỗi khi tải cấu hình');
    } finally {
      setLoading(false);
    }
  };

  const markChanged = () => setHasChanges(true);
  const updateSetting = (key, value) => { setSettings(prev => ({ ...prev, [key]: value })); markChanged(); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        ...settings,
        home_features: JSON.stringify(features),
        home_testimonials: JSON.stringify(testimonials),
        home_stats: JSON.stringify(stats),
        home_partners: JSON.stringify(partners),
        home_learning_path: JSON.stringify(learningPath),
        home_visual_features: JSON.stringify(visualFeatures),
        footer_columns: JSON.stringify(footerColumns),
        section_order: JSON.stringify(sectionOrder),
        section_visibility: JSON.stringify(sectionVisibility),
        custom_sections: JSON.stringify(customSections),
      };
      await api.post('/settings/bulk', { settings: dataToSave });
      toast.success('✅ Đã lưu thay đổi giao diện thành công!');
      setHasChanges(false);
    } catch {
      toast.error('Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  // Upload helper
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    if (res.data.success) return res.data.data.url;
    throw new Error('Upload failed');
  };

  // ─── Generic list handlers ───
  const createListHandlers = (setter) => ({
    add: (item) => { setter(prev => [...prev, item]); markChanged(); },
    remove: (i) => { setter(prev => prev.filter((_, idx) => idx !== i)); markChanged(); },
    update: (i, field, value) => { setter(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: value }; return n; }); markChanged(); },
    moveUp: (i) => { if (i === 0) return; setter(prev => { const n = [...prev]; [n[i-1], n[i]] = [n[i], n[i-1]]; return n; }); markChanged(); },
    moveDown: (i) => { setter(prev => { if (i >= prev.length - 1) return prev; const n = [...prev]; [n[i], n[i+1]] = [n[i+1], n[i]]; return n; }); markChanged(); },
  });

  const featureH = createListHandlers(setFeatures);
  const testimonialH = createListHandlers(setTestimonials);
  const statH = createListHandlers(setStats);
  const partnerH = createListHandlers(setPartners);
  const pathH = createListHandlers(setLearningPath);
  const visualH = createListHandlers(setVisualFeatures);

  // Footer handlers
  const addFooterCol = () => { if (footerColumns.length >= 5) return toast.error('Tối đa 5 cột'); setFooterColumns(prev => [...prev, { title: 'Cột mới', links: [{ text: 'Liên kết', url: '#' }] }]); markChanged(); };
  const removeFooterCol = (i) => { setFooterColumns(prev => prev.filter((_, idx) => idx !== i)); markChanged(); };
  const updateFooterTitle = (i, value) => { setFooterColumns(prev => { const n = [...prev]; n[i] = { ...n[i], title: value }; return n; }); markChanged(); };
  const addFooterLink = (ci) => { setFooterColumns(prev => { const n = [...prev]; n[ci] = { ...n[ci], links: [...n[ci].links, { text: 'Liên kết mới', url: '#' }] }; return n; }); markChanged(); };
  const removeFooterLink = (ci, li) => { setFooterColumns(prev => { const n = [...prev]; n[ci] = { ...n[ci], links: n[ci].links.filter((_, i) => i !== li) }; return n; }); markChanged(); };
  const updateFooterLink = (ci, li, field, value) => { setFooterColumns(prev => { const n = [...prev]; const links = [...n[ci].links]; links[li] = { ...links[li], [field]: value }; n[ci] = { ...n[ci], links }; return n; }); markChanged(); };


  if (loading) return <Loading fullPage message="Đang tải cấu hình giao diện..." />;

  const activeTabData = TABS.find(t => t.id === activeTab);

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>🎨 Quản Lý Giao Diện Web</h1>
          <p>Tùy chỉnh từng phần, hiệu ứng cuộn trang & nội dung trên Website</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <button onClick={() => setViewMode('visual')} style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', background: viewMode === 'visual' ? 'var(--primary)' : 'var(--bg-card)', color: viewMode === 'visual' ? '#fff' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
              <Eye size={14} /> Xem trực quan
            </button>
            <button onClick={() => setViewMode('tabs')} style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, border: 'none', borderLeft: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', background: viewMode === 'tabs' ? 'var(--primary)' : 'var(--bg-card)', color: viewMode === 'tabs' ? '#fff' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
              <Layout size={14} /> Chi tiết
            </button>
          </div>
          {hasChanges && (
            <span style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--warning-bg)', padding: '6px 12px', borderRadius: 'var(--radius-full)' }}>
              <Sparkles size={14} /> Chưa lưu
            </span>
          )}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 size={18} className="spinner" /> Đang lưu...</> : <><Save size={18} /> Lưu Tất Cả</>}
          </button>
        </div>
      </div>

      {/* ═══ VISUAL BUILDER (Elementor-style) ═══ */}
      {viewMode === 'visual' && (
        <VisualBuilder
          settings={settings} updateSetting={updateSetting}
          sectionOrder={sectionOrder} setSectionOrder={setSectionOrder}
          sectionVisibility={sectionVisibility} setSectionVisibility={setSectionVisibility}
          stats={stats} features={features} testimonials={testimonials}
          partners={partners} learningPath={learningPath} visualFeatures={visualFeatures}
          setStats={setStats} setFeatures={setFeatures} setTestimonials={setTestimonials}
          setPartners={setPartners} setLearningPath={setLearningPath} setVisualFeatures={setVisualFeatures}
          customSections={customSections} setCustomSections={setCustomSections}
          markChanged={markChanged}
          onSwitchToTabs={(tabId) => { setViewMode('tabs'); setActiveTab(tabId); }}
          onSave={handleSave} saving={saving} hasChanges={hasChanges}
        />
      )}

      {/* ═══ TABS MODE ═══ */}
      {viewMode === 'tabs' && (<>
      {/* Tabs */}
      <div className="tabs" style={{ flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button 
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Description */}
      {activeTabData && (
        <div style={{ marginBottom: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <activeTabData.icon size={16} style={{ color: 'var(--primary)', opacity: 0.7 }} />
          {activeTabData.desc}
          <button onClick={() => setViewMode('visual')} style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Eye size={12} /> Xem tổng quan
          </button>
        </div>
      )}

      {/* Tab Content */}
      <div style={{ paddingBottom: '4rem' }}>

        {/* ═══ HERO TAB ═══ */}
        {activeTab === 'hero' && (
          <div className="animate-fade-in">
            <AnimPicker settingKey="anim_hero" label="Hero Banner" settings={settings} updateSetting={updateSetting} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <SectionCard title="Nội dung Banner Chính" icon={Type}>
                <div className="form-group">
                  <label><Type size={14} /> Tiêu đề chính</label>
                  <textarea className="form-control" rows="3" placeholder="VD: Làm Chủ Word, Excel & PowerPoint"
                    value={settings.hero_title} onChange={e => updateSetting('hero_title', e.target.value)} />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Dùng ký tự xuống dòng để tách tiêu đề thành nhiều hàng
                  </small>
                </div>
                <div className="form-group">
                  <label>Mô tả phụ</label>
                  <textarea className="form-control" rows="3" placeholder="Mô tả ngắn gọn về dịch vụ..."
                    value={settings.hero_subtitle} onChange={e => updateSetting('hero_subtitle', e.target.value)} />
                </div>
              </SectionCard>
              
              <SectionCard title="Nút hành động (CTA)" icon={LinkIcon}>
                <div className="form-group">
                  <label>Chữ trên nút</label>
                  <input type="text" className="form-control" placeholder="VD: Bắt Đầu Học Ngay"
                    value={settings.hero_btn_text || ''} onChange={e => updateSetting('hero_btn_text', e.target.value)} />
                </div>
                <div className="form-group">
                  <label><LinkIcon size={14} /> Đường dẫn nút</label>
                  <input type="text" className="form-control" placeholder="VD: /courses"
                    value={settings.hero_btn_url || ''} onChange={e => updateSetting('hero_btn_url', e.target.value)} />
                </div>
                {/* Preview */}
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginTop: '8px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Xem trước</p>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.4, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {settings.hero_title || 'Tiêu đề chính'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    {settings.hero_subtitle || 'Mô tả phụ...'}
                  </div>
                  <span style={{ display: 'inline-block', background: 'var(--primary)', color: 'white', padding: '6px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600 }}>
                    {settings.hero_btn_text || 'Bắt Đầu Học Ngay'} →
                  </span>
                </div>
              </SectionCard>
            </div>

            {/* Hero Media Upload */}
            <div style={{ marginTop: '20px' }}>
              <SectionCard title="Hình ảnh / Video Hero" icon={ImageIcon}>
                <div className="form-group">
                  <label>Loại media</label>
                  <select className="form-control" value={settings.hero_media_type || 'image'} 
                    onChange={e => updateSetting('hero_media_type', e.target.value)}>
                    <option value="image">🖼️ Hình ảnh</option>
                    <option value="video">🎬 Video</option>
                  </select>
                </div>

                {(settings.hero_media_type || 'image') === 'image' ? (
                  <div className="form-group">
                    <label><ImageIcon size={14} /> URL hình ảnh Hero</label>
                    <input type="text" className="form-control" placeholder="URL hình ảnh hoặc upload bên dưới"
                      value={settings.hero_media_url || ''} onChange={e => updateSetting('hero_media_url', e.target.value)} />
                    <div style={{ marginTop: '10px' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                        <ImageIcon size={16} /> Tải ảnh lên
                        <input type="file" accept="image/*" hidden onChange={async (e) => {
                          const file = e.target.files[0]; if (!file) return;
                          const fd = new FormData(); fd.append('file', file);
                          try { const r = await api.post('/upload', fd); updateSetting('hero_media_url', r.data?.url || r.data?.data?.url); toast.success('Upload ảnh thành công!'); }
                          catch { toast.error('Lỗi upload ảnh'); }
                        }} />
                      </label>
                    </div>
                    {settings.hero_media_url && (
                      <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', maxHeight: '300px' }}>
                        <img src={settings.hero_media_url} alt="Hero Preview" style={{ width: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="form-group">
                    <label>🎬 URL Video</label>
                    <input type="text" className="form-control" placeholder="YouTube embed hoặc /uploads/video.mp4"
                      value={settings.hero_media_url || ''} onChange={e => updateSetting('hero_media_url', e.target.value)} />
                    <div style={{ marginTop: '10px' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#ef4444', color: 'white', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                        <Zap size={16} /> Tải video lên
                        <input type="file" accept="video/*" hidden onChange={async (e) => {
                          const file = e.target.files[0]; if (!file) return;
                          if (file.size > 100 * 1024 * 1024) return toast.error('Video tối đa 100MB');
                          const fd = new FormData(); fd.append('file', file);
                          const toastId = toast.loading(`Đang tải video (${(file.size / 1024 / 1024).toFixed(1)}MB)...`);
                          try { 
                            const r = await api.post('/upload', fd, { timeout: 300000 }); 
                            const url = r.data?.url || r.data?.data?.url;
                            updateSetting('hero_media_url', url); 
                            toast.success('Upload video thành công!', { id: toastId }); 
                          }
                          catch(err) { toast.error(err?.response?.data?.message || 'Lỗi upload video', { id: toastId }); }
                        }} />
                      </label>
                    </div>
                    {settings.hero_media_url && (
                      <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        {settings.hero_media_url.includes('youtube') || settings.hero_media_url.includes('youtu.be') ? (
                          <iframe src={settings.hero_media_url.replace('watch?v=', 'embed/')} style={{ width: '100%', height: '280px', border: 'none' }} title="Video" allowFullScreen />
                        ) : (
                          <video src={settings.hero_media_url} controls style={{ width: '100%', maxHeight: '300px' }} />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {settings.hero_media_url && (
                  <button type="button" style={{ marginTop: '8px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.8rem' }}
                    onClick={() => { updateSetting('hero_media_url', ''); toast.success('Đã xóa media'); }}>
                    🗑️ Xóa media
                  </button>
                )}
              </SectionCard>
            </div>
          </div>
        )}

        {/* ═══ STATS TAB ═══ */}
        {activeTab === 'stats' && (
          <div className="animate-fade-in">
            <AnimPicker settingKey="anim_stats" label="Thống Kê" settings={settings} updateSetting={updateSetting} />
            <SectionCard title="Con Số Ấn Tượng" icon={BarChart} count={stats.length}
              onAdd={() => statH.add({ value: '1,000+', label: 'Nhãn mới', icon: 'Users' })} addText="Thêm mục">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {stats.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Giá trị</label>
                      <input type="text" className="form-control" value={s.value} onChange={e => statH.update(i, 'value', e.target.value)} style={{ fontWeight: 700 }} />
                    </div>
                    <div style={{ flex: 1.5 }}>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Nhãn</label>
                      <input type="text" className="form-control" value={s.label} onChange={e => statH.update(i, 'label', e.target.value)} />
                    </div>
                    <button className="btn btn-icon btn-sm" onClick={() => statH.remove(i)} style={{ color: 'var(--danger)', alignSelf: 'flex-end', marginBottom: '2px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              {stats.length > 0 && (
                <div style={{ marginTop: '24px', padding: '20px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Xem trước</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
                    {stats.map((s, i) => (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{s.value}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* ═══ FEATURES TAB ═══ */}
        {activeTab === 'features' && (
          <div className="animate-fade-in">
            <AnimPicker settingKey="anim_features" label="Tính Năng" settings={settings} updateSetting={updateSetting} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <strong>{features.length}</strong> tính năng đang hiển thị
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => featureH.add({ title: 'Tính năng mới', desc: 'Mô tả chi tiết', icon: 'Zap' })}>
                <Plus size={16} /> Thêm tính năng
              </button>
            </div>
            <div className="cms-item-grid">
              {features.map((f, i) => (
                <ItemCard key={i} index={i} label="Tính năng" total={features.length}
                  onRemove={() => featureH.remove(i)} onMoveUp={() => featureH.moveUp(i)} onMoveDown={() => featureH.moveDown(i)}>
                  <div className="form-group">
                    <label>Icon</label>
                    <select className="form-control" value={f.icon} onChange={e => featureH.update(i, 'icon', e.target.value)}>
                      {ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tiêu đề</label>
                    <input type="text" className="form-control" value={f.title} onChange={e => featureH.update(i, 'title', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Mô tả</label>
                    <textarea className="form-control" rows="2" value={f.desc} onChange={e => featureH.update(i, 'desc', e.target.value)} />
                  </div>
                </ItemCard>
              ))}
              {features.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '2px dashed var(--border)' }}>
                  <Monitor size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                  <p>Chưa có tính năng nào. Nhấn "Thêm tính năng" để bắt đầu.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ LEARNING PATH TAB ═══ */}
        {activeTab === 'learning-path' && (
          <div className="animate-fade-in">
            <AnimPicker settingKey="anim_learning_path" label="Lộ Trình Học" settings={settings} updateSetting={updateSetting} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <strong>{learningPath.length}</strong> bước trong lộ trình
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => pathH.add({ step: String(learningPath.length + 1).padStart(2, '0'), title: 'Bước mới', desc: 'Mô tả bước', icon: 'Target' })}>
                <Plus size={16} /> Thêm bước
              </button>
            </div>
            <div className="cms-item-grid">
              {learningPath.map((p, i) => (
                <ItemCard key={i} index={i} label="Bước" total={learningPath.length}
                  onRemove={() => pathH.remove(i)} onMoveUp={() => pathH.moveUp(i)} onMoveDown={() => pathH.moveDown(i)}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label>Số bước</label>
                      <input type="text" className="form-control" value={p.step} onChange={e => pathH.update(i, 'step', e.target.value)} style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.1rem' }} />
                    </div>
                    <div className="form-group">
                      <label>Tiêu đề</label>
                      <input type="text" className="form-control" value={p.title} onChange={e => pathH.update(i, 'title', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Icon</label>
                    <select className="form-control" value={p.icon} onChange={e => pathH.update(i, 'icon', e.target.value)}>
                      {ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Mô tả</label>
                    <textarea className="form-control" rows="2" value={p.desc} onChange={e => pathH.update(i, 'desc', e.target.value)} />
                  </div>
                </ItemCard>
              ))}
              {learningPath.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '2px dashed var(--border)' }}>
                  <Target size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                  <p>Chưa có bước nào. Nhấn "Thêm bước" để tạo lộ trình.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ VISUAL LEARNING TAB ═══ */}
        {activeTab === 'visual-learning' && (
          <div className="animate-fade-in">
            <AnimPicker settingKey="anim_visual" label="Học Trực Quan" settings={settings} updateSetting={updateSetting} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <SectionCard title="Nội dung phần Học Trực Quan" icon={Laptop}>
                <div className="form-group">
                  <label>Tiêu đề</label>
                  <input type="text" className="form-control" placeholder="VD: Học Tập Trực Quan & Thực Hành"
                    value={settings.visual_title || ''} onChange={e => updateSetting('visual_title', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Tag / Badge</label>
                  <input type="text" className="form-control" placeholder="VD: 💻 Kỹ Năng Máy Tính 4.0"
                    value={settings.visual_subtitle || ''} onChange={e => updateSetting('visual_subtitle', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Mô tả chi tiết</label>
                  <textarea className="form-control" rows="3" placeholder="Mô tả về phần học trực quan..."
                    value={settings.visual_description || ''} onChange={e => updateSetting('visual_description', e.target.value)} />
                </div>
              </SectionCard>

              <SectionCard title="Danh sách tính năng" icon={Zap} count={visualFeatures.length}
                onAdd={() => visualH.add({ emoji: '📁', title: 'Tính năng mới', desc: 'Mô tả' })} addText="Thêm">
                {visualFeatures.map((vf, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '10px', background: 'var(--bg-subtle)' }}>
                    <input type="text" className="form-control" value={vf.emoji} onChange={e => visualH.update(i, 'emoji', e.target.value)} 
                      style={{ width: '50px', textAlign: 'center', fontSize: '1.2rem', padding: '6px' }} />
                    <div style={{ flex: 1 }}>
                      <input type="text" className="form-control" value={vf.title} onChange={e => visualH.update(i, 'title', e.target.value)} 
                        placeholder="Tiêu đề" style={{ marginBottom: '6px', fontWeight: 600 }} />
                      <input type="text" className="form-control" value={vf.desc} onChange={e => visualH.update(i, 'desc', e.target.value)} 
                        placeholder="Mô tả ngắn" style={{ fontSize: '0.85rem' }} />
                    </div>
                    <button className="btn btn-icon btn-sm" onClick={() => visualH.remove(i)} style={{ color: 'var(--danger)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </SectionCard>
            </div>

            {/* Visual Learning Media Upload */}
            <div style={{ marginTop: '20px' }}>
              <SectionCard title="Hình ảnh / Video Học Trực Quan" icon={ImageIcon}>
                <div className="form-group">
                  <label>Loại media</label>
                  <select className="form-control" value={settings.visual_media_type || 'image'} 
                    onChange={e => updateSetting('visual_media_type', e.target.value)}>
                    <option value="image">🖼️ Hình ảnh</option>
                    <option value="video">🎬 Video</option>
                  </select>
                </div>

                {(settings.visual_media_type || 'image') === 'image' ? (
                  <div className="form-group">
                    <label><ImageIcon size={14} /> URL hình ảnh</label>
                    <input type="text" className="form-control" placeholder="URL hình ảnh hoặc upload bên dưới"
                      value={settings.visual_media_url || ''} onChange={e => updateSetting('visual_media_url', e.target.value)} />
                    <div style={{ marginTop: '10px' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                        <ImageIcon size={16} /> Tải ảnh lên
                        <input type="file" accept="image/*" hidden onChange={async (e) => {
                          const file = e.target.files[0]; if (!file) return;
                          const fd = new FormData(); fd.append('file', file);
                          try { const r = await api.post('/upload', fd); updateSetting('visual_media_url', r.data?.url || r.data?.data?.url); toast.success('Upload ảnh thành công!'); }
                          catch { toast.error('Lỗi upload ảnh'); }
                        }} />
                      </label>
                    </div>
                    {settings.visual_media_url && (
                      <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', maxHeight: '300px' }}>
                        <img src={settings.visual_media_url} alt="Visual Preview" style={{ width: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="form-group">
                    <label>🎬 URL Video</label>
                    <input type="text" className="form-control" placeholder="YouTube embed hoặc /uploads/video.mp4"
                      value={settings.visual_media_url || ''} onChange={e => updateSetting('visual_media_url', e.target.value)} />
                    <div style={{ marginTop: '10px' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#ef4444', color: 'white', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                        <Zap size={16} /> Tải video lên
                        <input type="file" accept="video/*" hidden onChange={async (e) => {
                          const file = e.target.files[0]; if (!file) return;
                          if (file.size > 100 * 1024 * 1024) return toast.error('Video tối đa 100MB');
                          const fd = new FormData(); fd.append('file', file);
                          const toastId = toast.loading(`Đang tải video (${(file.size / 1024 / 1024).toFixed(1)}MB)...`);
                          try { 
                            const r = await api.post('/upload', fd, { timeout: 300000 }); 
                            const url = r.data?.url || r.data?.data?.url;
                            updateSetting('visual_media_url', url); 
                            toast.success('Upload video thành công!', { id: toastId }); 
                          }
                          catch(err) { toast.error(err?.response?.data?.message || 'Lỗi upload video', { id: toastId }); }
                        }} />
                      </label>
                    </div>
                    {settings.visual_media_url && (
                      <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        {settings.visual_media_url.includes('youtube') || settings.visual_media_url.includes('youtu.be') ? (
                          <iframe src={settings.visual_media_url.replace('watch?v=', 'embed/')} style={{ width: '100%', height: '280px', border: 'none' }} title="Video" allowFullScreen />
                        ) : (
                          <video src={settings.visual_media_url} controls style={{ width: '100%', maxHeight: '300px' }} />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {settings.visual_media_url && (
                  <button type="button" style={{ marginTop: '8px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.8rem' }}
                    onClick={() => { updateSetting('visual_media_url', ''); toast.success('Đã xóa media'); }}>
                    🗑️ Xóa media
                  </button>
                )}
              </SectionCard>
            </div>
          </div>
        )}

        {/* ═══ COURSES TAB ═══ */}
        {activeTab === 'courses' && (
          <div className="animate-fade-in">
            <SectionCard title="Phần Khóa Học Nổi Bật" icon={BookOpen}>
              <div className="form-group">
                <label><Type size={14} /> Tiêu đề</label>
                <input type="text" className="form-control" placeholder="VD: Khóa Học Được Yêu Thích"
                  value={settings.courses_title || ''} onChange={e => updateSetting('courses_title', e.target.value)} />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                  Để trống để dùng mặc định: "Khóa Học Được Yêu Thích"
                </small>
              </div>
              <div className="form-group">
                <label>Phụ đề</label>
                <input type="text" className="form-control" placeholder="VD: Chọn từ hàng chục khóa học chất lượng cao..."
                  value={settings.courses_subtitle || ''} onChange={e => updateSetting('courses_subtitle', e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label><LinkIcon size={14} /> Chữ trên nút "Xem tất cả"</label>
                <input type="text" className="form-control" placeholder="VD: Xem Tất Cả"
                  value={settings.courses_btn_text || ''} onChange={e => updateSetting('courses_btn_text', e.target.value)} />
              </div>
            </SectionCard>
            <CourseFeaturePicker />
          </div>
        )}

        {/* ═══ TESTIMONIALS TAB ═══ */}
        {activeTab === 'testimonials' && (
          <div className="animate-fade-in">
            <AnimPicker settingKey="anim_testimonials" label="Cảm Nhận" settings={settings} updateSetting={updateSetting} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <strong>{testimonials.length}</strong> cảm nhận đang hiển thị
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => testimonialH.add({ name: 'Họ tên', role: 'Vai trò', text: 'Nội dung cảm nhận', rating: 5, avatar: '' })}>
                <Plus size={16} /> Thêm cảm nhận
              </button>
            </div>
            <div className="cms-item-grid">
              {testimonials.map((t, i) => (
                <ItemCard key={i} index={i} label="Cảm nhận" total={testimonials.length}
                  onRemove={() => testimonialH.remove(i)} onMoveUp={() => testimonialH.moveUp(i)} onMoveDown={() => testimonialH.moveDown(i)}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label>Họ Tên</label>
                      <input type="text" className="form-control" value={t.name} onChange={e => testimonialH.update(i, 'name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Rating (1-5)</label>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '4px' }}>
                        {[1,2,3,4,5].map(star => (
                          <button key={star} onClick={() => testimonialH.update(i, 'rating', star)} 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: star <= (t.rating || 0) ? '#f59e0b' : '#ddd', padding: '2px' }}>
                            ★
                          </button>
                        ))}
                        <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.rating}/5</span>
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Vai trò / Công việc</label>
                    <input type="text" className="form-control" value={t.role} onChange={e => testimonialH.update(i, 'role', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Ảnh Đại Diện</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                      {t.avatar ? (
                        <img src={t.avatar} alt="Avatar" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
                      ) : (
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}>
                          <ImageIcon size={20} />
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '4px 12px' }}>
                          <ImageIcon size={12} /> Tải ảnh
                          <input type="file" accept="image/*,.webp" style={{ display: 'none' }} onChange={async e => {
                            try { const url = await uploadImage(e.target.files[0]); testimonialH.update(i, 'avatar', url); toast.success('Đã tải ảnh'); } catch { toast.error('Lỗi tải ảnh'); }
                          }} />
                        </label>
                        {t.avatar && (
                          <button className="btn btn-sm" style={{ fontSize: '0.7rem', padding: '2px 8px', color: 'var(--danger)' }} onClick={() => testimonialH.update(i, 'avatar', '')}>
                            <Trash2 size={10} /> Xóa ảnh
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Nội dung cảm nhận</label>
                    <textarea className="form-control" rows="3" value={t.text} onChange={e => testimonialH.update(i, 'text', e.target.value)} />
                  </div>
                </ItemCard>
              ))}
              {testimonials.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '2px dashed var(--border)' }}>
                  <Quote size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                  <p>Chưa có cảm nhận nào. Nhấn "Thêm cảm nhận" để bắt đầu.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ PARTNERS TAB ═══ */}
        {activeTab === 'partners' && (
          <div className="animate-fade-in">
            <AnimPicker settingKey="anim_partners" label="Đối Tác" settings={settings} updateSetting={updateSetting} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <strong>{partners.length}</strong> đối tác đang hiển thị
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => partnerH.add({ name: 'Công ty mới', logo: '' })}>
                <Plus size={16} /> Thêm đối tác
              </button>
            </div>
            <div className="cms-item-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {partners.map((p, i) => (
                <ItemCard key={i} index={i} label="Đối tác" total={partners.length}
                  onRemove={() => partnerH.remove(i)} onMoveUp={() => partnerH.moveUp(i)} onMoveDown={() => partnerH.moveDown(i)}>
                  <div className="form-group">
                    <label>Tên công ty</label>
                    <input type="text" className="form-control" value={p.name} onChange={e => partnerH.update(i, 'name', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Logo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                      {p.logo ? (
                        <img src={p.logo} alt={p.name} style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '12px', border: '1px solid var(--border)', background: '#fff', padding: '8px' }} />
                      ) : (
                        <div style={{ width: '80px', height: '80px', borderRadius: '12px', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}>
                          <ImageIcon size={24} />
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', fontSize: '0.75rem' }}>
                          <ImageIcon size={12} /> Tải logo
                          <input type="file" accept="image/*,.webp" style={{ display: 'none' }} onChange={async e => {
                            try { const url = await uploadImage(e.target.files[0]); partnerH.update(i, 'logo', url); toast.success('Đã tải logo'); } catch { toast.error('Lỗi tải logo'); }
                          }} />
                        </label>
                        <input type="text" className="form-control" value={p.logo} onChange={e => partnerH.update(i, 'logo', e.target.value)} placeholder="Hoặc nhập URL..." style={{ fontSize: '0.75rem', padding: '4px 8px' }} />
                      </div>
                    </div>
                  </div>
                </ItemCard>
              ))}
              {partners.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '2px dashed var(--border)' }}>
                  <Handshake size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                  <p>Chưa có đối tác nào. Nhấn "Thêm đối tác" để bắt đầu.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ CTA TAB ═══ */}
        {activeTab === 'cta' && (
          <div className="animate-fade-in">
            <AnimPicker settingKey="anim_cta" label="Kêu Gọi Hành Động" settings={settings} updateSetting={updateSetting} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <SectionCard title="Nội dung CTA" icon={Megaphone}>
                <div className="form-group">
                  <label>Tiêu đề CTA</label>
                  <input type="text" className="form-control" placeholder="VD: Sẵn Sàng Nâng Cấp Kỹ Năng Tin Học?"
                    value={settings.cta_title || ''} onChange={e => updateSetting('cta_title', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Mô tả CTA</label>
                  <textarea className="form-control" rows="3" placeholder="Mô tả kêu gọi hành động..."
                    value={settings.cta_subtitle || ''} onChange={e => updateSetting('cta_subtitle', e.target.value)} />
                </div>
              </SectionCard>
              <SectionCard title="Nút bấm CTA" icon={LinkIcon}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Nút chính - Chữ</label>
                    <input type="text" className="form-control" placeholder="VD: Đăng Ký Ngay"
                      value={settings.cta_btn_text || ''} onChange={e => updateSetting('cta_btn_text', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Nút chính - Link</label>
                    <input type="text" className="form-control" placeholder="VD: /register"
                      value={settings.cta_btn_url || ''} onChange={e => updateSetting('cta_btn_url', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Nút phụ - Chữ</label>
                    <input type="text" className="form-control" placeholder="VD: Xem Khóa Học"
                      value={settings.cta_btn2_text || ''} onChange={e => updateSetting('cta_btn2_text', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Nút phụ - Link</label>
                    <input type="text" className="form-control" placeholder="VD: /courses"
                      value={settings.cta_btn2_url || ''} onChange={e => updateSetting('cta_btn2_url', e.target.value)} />
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {/* ═══ PROMO TAB ═══ */}
        {activeTab === 'promo' && (
          <div className="animate-fade-in">
            <SectionCard title="Popup Khuyến Mãi" icon={Award}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <label className="toggle-switch">
                  <input type="checkbox" checked={settings.promo_enabled === 'true'} onChange={e => updateSetting('promo_enabled', e.target.checked ? 'true' : 'false')} />
                  <span className="toggle-slider" />
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: settings.promo_enabled === 'true' ? 'var(--success-bg)' : 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: `1px solid ${settings.promo_enabled === 'true' ? 'rgba(16,185,129,0.2)' : 'var(--border)'}` }}>
                  {settings.promo_enabled === 'true' ? <Eye size={16} color="var(--success)" /> : <EyeOff size={16} color="var(--text-muted)" />}
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: settings.promo_enabled === 'true' ? 'var(--success-text)' : 'var(--text-muted)' }}>
                    {settings.promo_enabled === 'true' ? 'Đang bật — Hiển thị cho người dùng' : 'Đang tắt — Ẩn với người dùng'}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label>Tiêu đề khuyến mãi</label>
                <input type="text" className="form-control" placeholder="VD: 🔥 Ưu đãi đặc biệt!" value={settings.promo_title || ''} onChange={e => updateSetting('promo_title', e.target.value)} />
              </div>

              {/* ── Hình ảnh popup ── */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={14} /> Hình ảnh popup
                </label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginTop: '8px' }}>
                  {/* Preview */}
                  <div style={{ flexShrink: 0 }}>
                    {settings.promo_image ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img
                          src={settings.promo_image}
                          alt="Promo preview"
                          style={{ width: '180px', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius)', border: '2px solid var(--primary)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
                        />
                        <button
                          onClick={() => updateSetting('promo_image', '')}
                          style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
                          title="Xóa ảnh"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: '180px', height: '120px', borderRadius: 'var(--radius)', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}>
                        <ImageIcon size={32} style={{ opacity: 0.3 }} />
                        <span style={{ fontSize: '0.72rem' }}>Chưa có ảnh</span>
                      </div>
                    )}
                  </div>

                  {/* Upload & URL controls */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'fit-content' }}>
                      <ImageIcon size={14} /> Tải hình ảnh lên
                      <input type="file" accept="image/*,.webp" style={{ display: 'none' }} onChange={async e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        try {
                          toast.loading('Đang tải ảnh...', { id: 'promo-upload' });
                          const url = await uploadImage(file);
                          updateSetting('promo_image', url);
                          toast.success('✅ Tải ảnh thành công!', { id: 'promo-upload' });
                        } catch {
                          toast.error('Lỗi khi tải ảnh', { id: 'promo-upload' });
                        }
                      }} />
                    </label>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Hoặc nhập URL ảnh</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="https://... hoặc /uploads/..."
                        value={settings.promo_image || ''}
                        onChange={e => updateSetting('promo_image', e.target.value)}
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Link khi nhấn vào popup</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="VD: /courses"
                        value={settings.promo_link || ''}
                        onChange={e => updateSetting('promo_link', e.target.value)}
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                      💡 Nếu có ảnh, popup sẽ hiển thị ảnh thay vì nội dung HTML bên dưới.
                    </p>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Nội dung (Hỗ trợ HTML) — dùng khi không có ảnh</label>
                <textarea className="form-control" rows="8" placeholder='<h2>Giảm giá 50%</h2>\n<p>Duy nhất hôm nay!</p>'
                  value={settings.promo_text} onChange={e => updateSetting('promo_text', e.target.value)} style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} />
              </div>
            </SectionCard>
          </div>
        )}

        {/* ═══ FOOTER TAB ═══ */}
        {activeTab === 'footer' && (
          <div className="animate-fade-in">
            <SectionCard title="Cấu Hình Chân Trang (Footer)" icon={Columns} 
              onAdd={addFooterCol} addText="Thêm Cột">
              <p style={{ margin: '-8px 0 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Tối đa 5 cột liên kết. Thông tin chính lấy từ Cài Đặt Chung.
              </p>
              <div className="cms-footer-columns">
                {footerColumns.map((col, ci) => (
                  <div key={ci} className="cms-footer-col">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <input type="text" className="form-control" value={col.title} placeholder="Tiêu đề cột..."
                        onChange={e => updateFooterTitle(ci, e.target.value)} style={{ fontWeight: 700, fontSize: '0.9rem' }} />
                      <button onClick={() => removeFooterCol(ci)} className="btn btn-icon btn-sm" style={{ color: 'var(--danger)', marginLeft: '8px', flexShrink: 0 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {col.links?.map((link, li) => (
                        <div key={li} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <input type="text" className="form-control" value={link.text} placeholder="Tên link"
                              onChange={e => updateFooterLink(ci, li, 'text', e.target.value)} style={{ fontSize: '0.8rem', padding: '7px 10px', marginBottom: '4px' }} />
                            <input type="text" className="form-control" value={link.url} placeholder="/url"
                              onChange={e => updateFooterLink(ci, li, 'url', e.target.value)} style={{ fontSize: '0.75rem', padding: '5px 10px', color: 'var(--text-muted)' }} />
                          </div>
                          <button onClick={() => removeFooterLink(ci, li)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: '12px' }} onClick={() => addFooterLink(ci)}>
                      <Plus size={14} /> Thêm Link
                    </button>
                  </div>
                ))}
                {footerColumns.length === 0 && (
                  <div style={{ width: '100%', textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '2px dashed var(--border)' }}>
                    <Columns size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                    <p>Chưa có cột nào. Nhấn "Thêm Cột" để bắt đầu.</p>
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        )}
      </div>
      </>)}

      {/* Floating Save Bar */}
      {hasChanges && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '32px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '12px 20px',
          boxShadow: 'var(--shadow-xl)', display: 'flex', alignItems: 'center',
          gap: '16px', zIndex: 50, animation: 'slideUp 0.3s ease',
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Bạn có thay đổi chưa lưu
          </span>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="spinner" /> : <Save size={14} />}
            {saving ? 'Đang lưu...' : 'Lưu ngay'}
          </button>
        </div>
      )}
    </div>
  );
}
