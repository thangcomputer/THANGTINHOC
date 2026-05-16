import { useState, useRef, useCallback } from 'react';
import {
  GripVertical, Eye, EyeOff, Plus, Trash2, ChevronLeft,
  Layout, BarChart, Monitor, Target, Laptop, BookOpen, Quote, Handshake,
  Megaphone, Settings, Layers, X, Grip, Package, Columns,
  Save, RefreshCcw, ArrowUp, ArrowDown, Palette, Search, PanelRightOpen, PanelRightClose,
} from 'lucide-react';
import HomeEditorPreview from './HomeEditorPreview';

const COLUMN_LAYOUTS = [
  { id: '1', label: '1 cột', cols: 1, template: '1fr' },
  { id: '2', label: '2 cột', cols: 2, template: '1fr 1fr' },
  { id: '3', label: '3 cột', cols: 3, template: '1fr 1fr 1fr' },
  { id: '4', label: '4 cột', cols: 4, template: '1fr 1fr 1fr 1fr' },
  { id: '2-1', label: '2/3 + 1/3', cols: 2, template: '2fr 1fr' },
  { id: '1-2', label: '1/3 + 2/3', cols: 2, template: '1fr 2fr' },
];

const SECTION_DEFS = {
  hero: { label: 'Hero Banner', emoji: '✨', icon: Layout, color: '#8b5cf6', desc: 'Banner chính với tiêu đề & nút CTA' },
  stats: { label: 'Thống Kê', emoji: '📊', icon: BarChart, color: '#6366f1', desc: 'Số liệu ấn tượng' },
  features: { label: 'Tính Năng', emoji: '🏆', icon: Monitor, color: '#f59e0b', desc: 'Các công cụ & kỹ năng' },
  'learning-path': { label: 'Lộ Trình', emoji: '🎯', icon: Target, color: '#10b981', desc: '4 bước học tập' },
  'visual-learning': { label: 'Học Trực Quan', emoji: '💻', icon: Laptop, color: '#3b82f6', desc: 'Kỹ năng máy tính 4.0' },
  courses: { label: 'Khóa Học', emoji: '📚', icon: BookOpen, color: '#8b5cf6', desc: 'Khóa học nổi bật' },
  testimonials: { label: 'Cảm Nhận', emoji: '💬', icon: Quote, color: '#ec4899', desc: 'Đánh giá học viên' },
  partners: { label: 'Đối Tác', emoji: '🤝', icon: Handshake, color: '#eab308', desc: 'Logo đối tác' },
  cta: { label: 'Kêu Gọi', emoji: '🚀', icon: Megaphone, color: '#7c3aed', desc: 'Call to Action cuối trang' },
};

const ALL_SECTION_IDS = Object.keys(SECTION_DEFS);

export default function VisualBuilder({
  settings, updateSetting, sectionOrder, setSectionOrder,
  sectionVisibility, setSectionVisibility,
  stats, features, testimonials, partners, visualFeatures,
  setStats, setFeatures, setTestimonials, setPartners, setVisualFeatures,
  customSections, setCustomSections,
  markChanged, onSwitchToTabs, onSave, saving, hasChanges,
  previewRefreshKey = 0,
}) {
  const [liveSitePreview, setLiveSitePreview] = useState(true);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('widgets');
  const [showStructure, setShowStructure] = useState(true);
  const [widgetSearch, setWidgetSearch] = useState('');

  // Drag state
  const [dragType, setDragType] = useState(null); // 'reorder' | 'add-widget'
  const [dragPayload, setDragPayload] = useState(null); // section id being dragged
  const [dragSourceIdx, setDragSourceIdx] = useState(null); // index in sectionOrder (for reorder)
  const [dropTargetIdx, setDropTargetIdx] = useState(null); // drop zone index

  const previewRef = useRef(null);
  // Get section def — supports both predefined and custom containers
  const getSectionDef = (id) => {
    if (SECTION_DEFS[id]) return SECTION_DEFS[id];
    if (id?.startsWith('container-')) {
      const cs = customSections[id];
      return { label: cs?.title || 'Vùng Chứa', emoji: '📦', icon: Columns, color: '#14b8a6', desc: `Container ${cs?.columns || 2} cột`, isContainer: true };
    }
    return null;
  };
  const def = selectedSection ? getSectionDef(selectedSection) : null;

  // ────── Section Management ──────
  const toggleVisibility = (id) => {
    const newVis = { ...sectionVisibility };
    if (newVis[id]) { delete newVis[id]; } else { newVis[id] = true; }
    setSectionVisibility(newVis);
    markChanged();
  };

  const removeSection = (id) => {
    setSectionOrder(prev => prev.filter(s => s !== id));
    if (id?.startsWith('container-')) {
      setCustomSections(prev => { const n = {...prev}; delete n[id]; return n; });
    }
    if (selectedSection === id) setSelectedSection(null);
    markChanged();
  };

  // ────── Container Management ──────
  const addContainer = (insertIdx) => {
    const existingIds = Object.keys(customSections).map(k => parseInt(k.replace('container-',''))).filter(n => !isNaN(n));
    const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    const id = `container-${nextId}`;
    const newContainer = {
      title: `Vùng Chứa ${nextId}`,
      columns: 2,
      layout: '1fr 1fr',
      bgColor: '#0f172a',
      items: [
        { icon: '📌', title: 'Tiêu đề 1', desc: 'Mô tả nội dung cột 1', btnText: '', btnUrl: '' },
        { icon: '⚡', title: 'Tiêu đề 2', desc: 'Mô tả nội dung cột 2', btnText: '', btnUrl: '' },
      ],
    };
    setCustomSections(prev => ({...prev, [id]: newContainer}));
    const newOrder = [...sectionOrder];
    newOrder.splice(insertIdx, 0, id);
    setSectionOrder(newOrder);
    setSelectedSection(id);
    setSidebarTab('settings');
    markChanged();
  };

  const updateContainer = (id, key, value) => {
    setCustomSections(prev => ({
      ...prev, [id]: { ...prev[id], [key]: value }
    }));
    markChanged();
  };

  const changeContainerLayout = (id, layoutDef) => {
    const cs = customSections[id];
    const oldItems = cs?.items || [];
    const newItems = Array.from({ length: layoutDef.cols }, (_, i) =>
      oldItems[i] || { icon: '📌', title: `Tiêu đề ${i+1}`, desc: 'Mô tả nội dung', btnText: '', btnUrl: '' }
    );
    setCustomSections(prev => ({
      ...prev, [id]: { ...prev[id], columns: layoutDef.cols, layout: layoutDef.template, items: newItems }
    }));
    markChanged();
  };

  const addSectionAt = (id, insertIdx) => {
    if (sectionOrder.includes(id)) return;
    const newOrder = [...sectionOrder];
    newOrder.splice(insertIdx, 0, id);
    setSectionOrder(newOrder);
    markChanged();
  };

  const resetAll = () => {
    setSectionOrder([...ALL_SECTION_IDS]);
    setSectionVisibility({});
    setCustomSections({});
    markChanged();
  };

  // ────── Drag & Drop: Widget from sidebar → Preview ──────
  const onWidgetDragStart = (e, sectionId) => {
    setDragType('add-widget');
    setDragPayload(sectionId);
    setDragSourceIdx(null);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', sectionId);
    // Custom drag image
    const ghost = document.createElement('div');
    ghost.style.cssText = 'position:fixed;top:-100px;padding:8px 16px;background:#6366f1;color:#fff;border-radius:8px;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.3);pointer-events:none;z-index:9999;';
    ghost.textContent = `${SECTION_DEFS[sectionId]?.emoji} ${SECTION_DEFS[sectionId]?.label}`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => ghost.remove(), 0);
  };

  // ────── Drag & Drop: Reorder within preview ──────
  const onSectionDragStart = (e, idx) => {
    setDragType('reorder');
    setDragPayload(sectionOrder[idx]);
    setDragSourceIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sectionOrder[idx]);
  };

  // Drop zone handlers
  const onDropZoneDragOver = useCallback((e, zoneIdx) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = dragType === 'add-widget' ? 'copy' : 'move';
    setDropTargetIdx(zoneIdx);
  }, [dragType]);

  const onDropZoneDragLeave = useCallback((e) => {
    e.preventDefault();
    setDropTargetIdx(null);
  }, []);

  const onDropZoneDrop = useCallback((e, zoneIdx) => {
    e.preventDefault();
    e.stopPropagation();

    if (dragType === 'add-widget' && dragPayload) {
      // Add widget from sidebar at this position
      addSectionAt(dragPayload, zoneIdx);
    } else if (dragType === 'reorder' && dragSourceIdx !== null) {
      // Reorder: move section from dragSourceIdx to zoneIdx
      const newOrder = [...sectionOrder];
      const [moved] = newOrder.splice(dragSourceIdx, 1);
      const insertAt = zoneIdx > dragSourceIdx ? zoneIdx - 1 : zoneIdx;
      newOrder.splice(insertAt, 0, moved);
      setSectionOrder(newOrder);
      markChanged();
    }

    setDragType(null);
    setDragPayload(null);
    setDragSourceIdx(null);
    setDropTargetIdx(null);
  }, [dragType, dragPayload, dragSourceIdx, sectionOrder]);

  const onDragEnd = () => {
    setDragType(null);
    setDragPayload(null);
    setDragSourceIdx(null);
    setDropTargetIdx(null);
  };

  const moveSection = (idx, dir) => {
    const n = [...sectionOrder];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= n.length) return;
    [n[idx], n[newIdx]] = [n[newIdx], n[idx]];
    setSectionOrder(n);
    markChanged();
  };

  // ────── Available widgets (not yet in page) ──────
  const availableWidgets = ALL_SECTION_IDS.filter(id => !sectionOrder.includes(id));
  const filteredWidgets = widgetSearch
    ? availableWidgets.filter(id => SECTION_DEFS[id].label.toLowerCase().includes(widgetSearch.toLowerCase()))
    : availableWidgets;

  // ────── Drop Zone Component ──────
  const DropZone = ({ idx, isEmpty }) => {
    const isActive = dropTargetIdx === idx && dragType;
    const isVisible = dragType !== null; // Show all drop zones during any drag

    return (
      <div
        onDragOver={(e) => onDropZoneDragOver(e, idx)}
        onDragLeave={onDropZoneDragLeave}
        onDrop={(e) => onDropZoneDrop(e, idx)}
        style={{
          position: 'relative',
          height: isActive ? '80px' : (isVisible ? '32px' : (isEmpty ? '120px' : '4px')),
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: isEmpty ? '0' : '0',
        }}
      >
        {/* Active drop indicator */}
        {isActive && (
          <div style={{
            position: 'absolute', inset: '4px', borderRadius: '10px',
            border: '2px dashed #6366f1',
            background: 'rgba(99, 102, 241, 0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            animation: 'dropZonePulse 1.5s ease-in-out infinite',
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99,102,241,0.4)',
            }}>
              <Plus size={14} color="#fff" />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#818cf8' }}>
              {dragType === 'add-widget' ? 'Thả widget vào đây' : 'Di chuyển đến đây'}
            </span>
          </div>
        )}

        {/* Visible line during drag (but not active) */}
        {isVisible && !isActive && !isEmpty && (
          <div style={{
            position: 'absolute', left: '16px', right: '16px', top: '50%', transform: 'translateY(-50%)',
            height: '2px', borderRadius: '2px',
            background: 'rgba(99, 102, 241, 0.2)',
            transition: 'all 0.2s',
          }} />
        )}

        {/* Empty state */}
        {isEmpty && !isActive && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            color: 'rgba(255,255,255,0.2)',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              border: '2px dashed rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={18} />
            </div>
            <span style={{ fontSize: '0.72rem' }}>Kéo widget từ sidebar vào đây</span>
          </div>
        )}
      </div>
    );
  };

  // ────── Preview Render ──────
  const renderPreview = (sectionId) => {
    switch (sectionId) {
      case 'hero':
        return (
          <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)', padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', background: 'rgba(139,92,246,0.3)', padding: '4px 14px', borderRadius: '99px', display: 'inline-flex', color: '#c4b5fd', marginBottom: '12px' }}>✨ Thắng Tin Học</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: '0 0 8px', lineHeight: 1.3 }}>{settings.hero_title || 'HỌC SỬ DỤNG MÁY VI TÍNH 1 KÈM 1 ONLINE'}</h2>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px', maxWidth: '500px', marginInline: 'auto' }}>{settings.hero_subtitle || 'Hướng dẫn chi tiết từ cơ bản nhất'}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <span style={{ padding: '8px 20px', borderRadius: '8px', background: '#6366f1', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>{settings.hero_btn_text || 'Đăng ký ngay'}</span>
              <span style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: '0.75rem' }}>Xem khóa học</span>
            </div>
          </div>
        );
      case 'stats':
        return (
          <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)', padding: '24px 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(stats.length || 4, 4)}, 1fr)`, gap: '12px' }}>
              {(stats.length > 0 ? stats : [{value:'5,000+',label:'Học viên'},{value:'50+',label:'Khóa học'}]).map((s,i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#818cf8' }}>{s.value}</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'features':
        return (
          <div style={{ background: '#0f172a', padding: '28px 32px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: '0 0 16px', textAlign: 'center' }}>Công Cụ Bạn Sẽ Thành Thạo</h3>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(features.length || 4, 4)}, 1fr)`, gap: '10px' }}>
              {(features.length > 0 ? features.slice(0,4) : [{icon:'📝',title:'Word'},{icon:'📊',title:'Excel'}]).map((f,i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '6px' }}>{f.icon || '⚡'}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fff' }}>{f.title}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'learning-path':
        return (
          <div style={{ background: '#0f172a', padding: '28px 32px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: '0 0 16px', textAlign: 'center' }}>Lộ Trình Học Tập</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {['01 Đăng Ký', '02 Chọn Khóa', '03 Học Online', '04 Chứng Chỉ'].map((s,i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px', textAlign: 'center', color: '#fff', fontSize: '0.72rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, margin: '0 auto 8px' }}>{s.split(' ')[0]}</div>
                  {s.split(' ').slice(1).join(' ')}
                </div>
              ))}
            </div>
          </div>
        );
      case 'visual-learning':
        return (
          <div style={{ background: '#0f172a', padding: '28px 32px' }}>
            <span style={{ fontSize: '0.65rem', background: 'rgba(59,130,246,0.2)', padding: '3px 10px', borderRadius: '99px', color: '#60a5fa' }}>{settings.visual_subtitle || '💻 Kỹ Năng Máy Tính 4.0'}</span>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: '8px 0' }}>{settings.visual_title || 'Học Tập Trực Quan'}</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(visualFeatures.length > 0 ? visualFeatures : [{emoji:'📁',title:'Dữ liệu'},{emoji:'⚡',title:'Hiệu suất'}]).map((v,i) => (
                <span key={i} style={{ background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', color: '#fff' }}>{v.emoji} {v.title}</span>
              ))}
            </div>
          </div>
        );
      case 'courses':
        return (
          <div style={{ background: '#0f172a', padding: '28px 32px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>{settings.courses_title || 'Khóa Học Được Yêu Thích'}</h3>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>{settings.courses_subtitle || 'Chọn từ hàng chục khóa học chất lượng cao'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '50px', background: `linear-gradient(135deg, hsl(${i*60},70%,40%), hsl(${i*60+30},70%,50%))` }} />
                  <div style={{ padding: '8px', fontSize: '0.7rem', fontWeight: 600, color: '#fff' }}>Khóa học {i}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'testimonials':
        return (
          <div style={{ background: '#0f172a', padding: '28px 32px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: '0 0 16px', textAlign: 'center' }}>Cảm Nhận Học Viên</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {(testimonials.length > 0 ? testimonials.slice(0,3) : [{name:'A',text:'Tuyệt!'},{name:'B',text:'Hay!'},{name:'C',text:'Giỏi!'}]).map((t,i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ color: '#fbbf24', fontSize: '0.7rem', marginBottom: '6px' }}>★★★★★</div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', fontStyle: 'italic' }}>"{t.text || '...'}"</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fff' }}>{t.name}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'partners':
        return (
          <div style={{ background: '#0f172a', padding: '28px 32px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: '0 0 16px' }}>Đối Tác Chiến Lược</h3>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {(partners.length > 0 ? partners : [{name:'FPT'},{name:'Viettel'},{name:'VinGroup'}]).map((p,i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 18px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {p.logo ? <img src={p.logo} alt="" style={{ height: '24px' }} /> : <Handshake size={16} style={{ color: '#818cf8' }} />}
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fff' }}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'cta':
        return (
          <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '32px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>{settings.cta_title || 'Sẵn Sàng Nâng Cấp Kỹ Năng?'}</h3>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', margin: '0 0 14px' }}>{settings.cta_subtitle || 'Đăng ký ngay hôm nay'}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <span style={{ padding: '8px 20px', borderRadius: '8px', background: '#fff', color: '#4f46e5', fontSize: '0.75rem', fontWeight: 700 }}>{settings.cta_btn_text || 'Đăng Ký Ngay'}</span>
              <span style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: '0.75rem' }}>{settings.cta_btn2_text || 'Xem Khóa Học'}</span>
            </div>
          </div>
        );
      default:
        // Custom container
        if (sectionId?.startsWith('container-')) {
          const cs = customSections[sectionId];
          if (!cs) return null;
          return (
            <div style={{ background: cs.bgColor || '#0f172a', padding: '28px 24px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', margin: '0 0 14px', textAlign: 'center' }}>{cs.title}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: cs.layout || '1fr 1fr', gap: '12px' }}>
                {(cs.items || []).map((item, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: '1.3rem', marginBottom: '8px' }}>{item.icon || '📌'}</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{item.title || 'Tiêu đề'}</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{item.desc || 'Mô tả'}</div>
                    {item.btnText && (
                      <div style={{ marginTop: '10px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '6px', background: '#6366f1', color: '#fff', fontSize: '0.65rem', fontWeight: 600 }}>{item.btnText}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>
                📦 Container • {cs.columns} cột • {cs.layout}
              </div>
            </div>
          );
        }
        return null;
    }
  };

  // ────── Settings Panel ──────
  const renderSettings = () => {
    if (!selectedSection || !sectionOrder.includes(selectedSection)) return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Layers size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
        <p style={{ fontSize: '0.8rem' }}>Chọn một phần trên preview<br/>để chỉnh sửa</p>
      </div>
    );

    const isHidden = !!sectionVisibility[selectedSection];

    const sectionActions = (
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        <button className="btn btn-outline btn-sm" onClick={() => toggleVisibility(selectedSection)}
          style={{ flex: 1, fontSize: '0.7rem', color: isHidden ? 'var(--danger)' : 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          {isHidden ? <><EyeOff size={12} /> Đang ẩn</> : <><Eye size={12} /> Đang hiện</>}
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => removeSection(selectedSection)}
          style={{ fontSize: '0.7rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Trash2 size={12} /> Xóa
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => onSwitchToTabs(selectedSection)}
          style={{ fontSize: '0.7rem' }}>
          Chi tiết →
        </button>
      </div>
    );

    switch (selectedSection) {
      case 'hero':
        return (<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{sectionActions}
          <div className="form-group"><label style={lbl}>Tiêu đề</label><input type="text" className="form-control" value={settings.hero_title||''} onChange={e=>updateSetting('hero_title',e.target.value)} style={inp} /></div>
          <div className="form-group"><label style={lbl}>Phụ đề</label><textarea className="form-control" rows="2" value={settings.hero_subtitle||''} onChange={e=>updateSetting('hero_subtitle',e.target.value)} style={inp} /></div>
          <div className="form-group"><label style={lbl}>Nút CTA</label><input type="text" className="form-control" value={settings.hero_btn_text||''} onChange={e=>updateSetting('hero_btn_text',e.target.value)} style={inp} /></div>
          <div className="form-group"><label style={lbl}>Link CTA</label><input type="text" className="form-control" value={settings.hero_btn_url||''} onChange={e=>updateSetting('hero_btn_url',e.target.value)} style={inp} /></div>
        </div>);
      case 'stats':
        return (<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{sectionActions}
          {stats.map((s,i)=> (
            <div key={i} style={{ background: 'var(--bg-subtle)', borderRadius: '8px', padding: '8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input type="text" className="form-control" value={s.value} onChange={e=>{const n=[...stats];n[i]={...n[i],value:e.target.value};setStats(n);markChanged();}} placeholder="Giá trị" style={{...inp,flex:1}} />
              <input type="text" className="form-control" value={s.label} onChange={e=>{const n=[...stats];n[i]={...n[i],label:e.target.value};setStats(n);markChanged();}} placeholder="Nhãn" style={{...inp,flex:1}} />
              <button onClick={()=>{setStats(stats.filter((_,j)=>j!==i));markChanged();}} style={delBtn}><Trash2 size={12}/></button>
            </div>
          ))}
          <button className="btn btn-outline btn-sm" onClick={()=>{setStats([...stats,{value:'',label:''}]);markChanged();}} style={{ width: '100%' }}><Plus size={12}/> Thêm</button>
        </div>);
      case 'visual-learning':
        return (<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{sectionActions}
          <div className="form-group"><label style={lbl}>Tiêu đề</label><input type="text" className="form-control" value={settings.visual_title||''} onChange={e=>updateSetting('visual_title',e.target.value)} style={inp} /></div>
          <div className="form-group"><label style={lbl}>Tag</label><input type="text" className="form-control" value={settings.visual_subtitle||''} onChange={e=>updateSetting('visual_subtitle',e.target.value)} style={inp} /></div>
          <label style={lbl}>Tính năng ({visualFeatures.length})</label>
          {visualFeatures.map((v,i)=>(
            <div key={i} style={{background:'var(--bg-subtle)',borderRadius:'6px',padding:'6px',display:'flex',gap:'4px',alignItems:'center'}}>
              <input type="text" className="form-control" value={v.emoji} onChange={e=>{const n=[...visualFeatures];n[i]={...n[i],emoji:e.target.value};setVisualFeatures(n);markChanged();}} style={{...inp,width:'36px',textAlign:'center'}} />
              <input type="text" className="form-control" value={v.title} onChange={e=>{const n=[...visualFeatures];n[i]={...n[i],title:e.target.value};setVisualFeatures(n);markChanged();}} style={{...inp,flex:1}} placeholder="Tên" />
              <button onClick={()=>{setVisualFeatures(visualFeatures.filter((_,j)=>j!==i));markChanged();}} style={delBtn}><Trash2 size={12}/></button>
            </div>
          ))}
          <button className="btn btn-outline btn-sm" onClick={()=>{setVisualFeatures([...visualFeatures,{emoji:'⚡',title:'',desc:''}]);markChanged();}}><Plus size={12}/> Thêm</button>
        </div>);
      case 'courses':
        return (<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{sectionActions}
          <div className="form-group"><label style={lbl}>Tiêu đề</label><input type="text" className="form-control" value={settings.courses_title||''} onChange={e=>updateSetting('courses_title',e.target.value)} style={inp} /></div>
          <div className="form-group"><label style={lbl}>Phụ đề</label><input type="text" className="form-control" value={settings.courses_subtitle||''} onChange={e=>updateSetting('courses_subtitle',e.target.value)} style={inp} /></div>
          <div style={{background:'var(--bg-subtle)',padding:'8px',borderRadius:'6px',fontSize:'0.7rem',color:'var(--text-muted)'}}>💡 Danh sách lấy từ Quản lý Khóa Học</div>
        </div>);
      case 'cta':
        return (<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{sectionActions}
          <div className="form-group"><label style={lbl}>Tiêu đề</label><input type="text" className="form-control" value={settings.cta_title||''} onChange={e=>updateSetting('cta_title',e.target.value)} style={inp} /></div>
          <div className="form-group"><label style={lbl}>Mô tả</label><textarea className="form-control" rows="2" value={settings.cta_subtitle||''} onChange={e=>updateSetting('cta_subtitle',e.target.value)} style={inp} /></div>
          <div className="form-group"><label style={lbl}>Nút chính</label><input type="text" className="form-control" value={settings.cta_btn_text||''} onChange={e=>updateSetting('cta_btn_text',e.target.value)} style={inp} /></div>
          <div className="form-group"><label style={lbl}>Nút phụ</label><input type="text" className="form-control" value={settings.cta_btn2_text||''} onChange={e=>updateSetting('cta_btn2_text',e.target.value)} style={inp} /></div>
        </div>);
      default:
        // Custom container settings
        if (selectedSection?.startsWith('container-')) {
          const cs = customSections[selectedSection];
          if (!cs) return null;
          const updateItem = (idx, key, val) => {
            const items = [...(cs.items || [])];
            items[idx] = { ...items[idx], [key]: val };
            updateContainer(selectedSection, 'items', items);
          };
          return (<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{sectionActions}
            <div className="form-group"><label style={lbl}>Tên container</label>
              <input type="text" className="form-control" value={cs.title||''} onChange={e=>updateContainer(selectedSection,'title',e.target.value)} style={inp} /></div>
            <div className="form-group"><label style={lbl}>Màu nền</label>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input type="color" value={cs.bgColor||'#0f172a'} onChange={e=>updateContainer(selectedSection,'bgColor',e.target.value)} style={{ width: '32px', height: '28px', border: 'none', cursor: 'pointer' }} />
                <input type="text" className="form-control" value={cs.bgColor||''} onChange={e=>updateContainer(selectedSection,'bgColor',e.target.value)} style={{...inp,flex:1}} /></div></div>
            <label style={lbl}>Layout cột</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
              {COLUMN_LAYOUTS.map(l => (
                <button key={l.id} onClick={() => changeContainerLayout(selectedSection, l)}
                  style={{ padding: '6px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', textAlign: 'center',
                    background: cs.layout === l.template ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: cs.layout === l.template ? '#fff' : 'var(--text-muted)',
                    border: cs.layout === l.template ? '1px solid var(--primary)' : '1px solid var(--border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: l.template, gap: '2px', marginBottom: '3px' }}>
                    {Array.from({length: l.cols}).map((_,i) => (
                      <div key={i} style={{ height: '14px', borderRadius: '2px', background: cs.layout === l.template ? 'rgba(255,255,255,0.3)' : 'var(--border)' }} />
                    ))}
                  </div>
                  {l.label}
                </button>
              ))}
            </div>
            <label style={{...lbl, marginTop: '8px'}}>Nội dung cột ({cs.items?.length || 0})</label>
            {(cs.items || []).map((item, i) => (
              <div key={i} style={{ background: 'var(--bg-subtle)', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '3px solid #14b8a6' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>Cột {i+1}</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input type="text" className="form-control" value={item.icon} onChange={e=>updateItem(i,'icon',e.target.value)} style={{...inp,width:'36px',textAlign:'center'}} placeholder="📌" />
                  <input type="text" className="form-control" value={item.title} onChange={e=>updateItem(i,'title',e.target.value)} style={{...inp,flex:1}} placeholder="Tiêu đề" />
                </div>
                <textarea className="form-control" rows="2" value={item.desc} onChange={e=>updateItem(i,'desc',e.target.value)} style={inp} placeholder="Mô tả" />
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input type="text" className="form-control" value={item.btnText||''} onChange={e=>updateItem(i,'btnText',e.target.value)} style={{...inp,flex:1}} placeholder="Nút (tùy chọn)" />
                  <input type="text" className="form-control" value={item.btnUrl||''} onChange={e=>updateItem(i,'btnUrl',e.target.value)} style={{...inp,flex:1}} placeholder="Link" />
                </div>
              </div>
            ))}
          </div>);
        }
        return (<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{sectionActions}
          <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            Nhấn <strong>"Chi tiết →"</strong> để chỉnh sửa đầy đủ
          </div>
        </div>);
    }
  };

  const lbl = { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' };
  const inp = { fontSize: '0.8rem', padding: '7px 10px' };
  const delBtn = { background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', flexShrink: 0 };
  const ctrlBtn = { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', padding: '3px', borderRadius: '3px', display: 'flex', alignItems: 'center' };

  const livePreviewTab =
    selectedSection ||
    sectionOrder.find((id) => !sectionVisibility[id]) ||
    sectionOrder[0] ||
    'hero';

  return (
    <div style={{ display: 'flex', gap: '0', height: 'calc(100vh - 130px)', margin: '-24px -32px -32px', borderTop: '1px solid var(--border)' }}>
      {/* ═══ LEFT SIDEBAR — Elementor Widget Panel ═══ */}
      <div style={{ width: '280px', flexShrink: 0, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Sidebar Header */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Palette size={14} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>Visual Builder</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Kéo thả widget vào preview</div>
          </div>
        </div>

        {/* Sidebar Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {[{id:'widgets',label:'Widgets',icon:Package},{id:'settings',label:'Cài đặt',icon:Settings}].map(t => (
            <button key={t.id} onClick={() => setSidebarTab(t.id)}
              style={{ flex: 1, padding: '8px', background: sidebarTab === t.id ? 'var(--bg-subtle)' : 'transparent', border: 'none', borderBottom: sidebarTab === t.id ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, color: sidebarTab === t.id ? 'var(--text)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <t.icon size={12} /> {t.label}
            </button>
          ))}
        </div>

        {/* Sidebar Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {sidebarTab === 'widgets' && (
            <div>
              {/* Search */}
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Tìm widget..." value={widgetSearch} onChange={e => setWidgetSearch(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', fontSize: '0.72rem', color: 'var(--text)', outline: 'none' }} />
              </div>

              {/* Active sections (on page) */}
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Đang sử dụng ({sectionOrder.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '16px' }}>
                {sectionOrder.map(id => {
                  const d = getSectionDef(id); if (!d) return null;
                  const isHidden = !!sectionVisibility[id];
                  const Icon = d.icon;
                  return (
                    <div key={id} onClick={() => { setSelectedSection(id); setSidebarTab('settings'); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px',
                        borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s',
                        background: selectedSection === id ? `${d.color}15` : 'transparent',
                        border: selectedSection === id ? `1px solid ${d.color}40` : '1px solid transparent',
                        opacity: isHidden ? 0.4 : 1,
                      }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: `${d.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={11} style={{ color: d.color }} />
                      </div>
                      <span style={{ flex: 1, fontSize: '0.7rem', fontWeight: 600, color: 'var(--text)', textDecoration: isHidden ? 'line-through' : 'none' }}>{d.label}</span>
                      <button onClick={(e) => { e.stopPropagation(); toggleVisibility(id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: isHidden ? 'var(--danger)' : 'var(--text-muted)' }} title={isHidden ? 'Hiện' : 'Ẩn'}>
                        {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); removeSection(id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-muted)' }} title="Xóa">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Available widgets to drag (Elementor-style grid) */}
              {availableWidgets.length > 0 && (
                <>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Kéo thả vào trang ({filteredWidgets.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {filteredWidgets.map(id => {
                      const d = SECTION_DEFS[id];
                      const Icon = d.icon;
                      return (
                        <div key={id}
                          draggable
                          onDragStart={(e) => onWidgetDragStart(e, id)}
                          onDragEnd={onDragEnd}
                          onClick={() => addSectionAt(id, sectionOrder.length)}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                            padding: '12px 8px', borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-subtle)',
                            cursor: 'grab', transition: 'all 0.15s',
                            userSelect: 'none',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = d.color; e.currentTarget.style.background = `${d.color}10`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.transform = 'none'; }}
                        >
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${d.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={16} style={{ color: d.color }} />
                          </div>
                          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text)', textAlign: 'center', lineHeight: 1.2 }}>{d.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {availableWidgets.length === 0 && (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                  ✅ Tất cả widget đã được sử dụng
                </div>
              )}

              {/* Add Container Button */}
              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Vùng chứa tùy chỉnh
                </div>
                <button onClick={() => addContainer(sectionOrder.length)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px dashed #14b8a6', background: 'rgba(20,184,166,0.05)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.12)'; e.currentTarget.style.borderColor = '#2dd4bf'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.05)'; e.currentTarget.style.borderColor = '#14b8a6'; }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#14b8a620', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Columns size={16} style={{ color: '#14b8a6' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#14b8a6' }}>+ Thêm Vùng Chứa Mới</span>
                  <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Tạo section tùy chỉnh với nhiều cột</span>
                </button>
              </div>
            </div>
          )}

          {sidebarTab === 'settings' && (
            <div>
              {def && sectionOrder.includes(selectedSection) && (
                <div style={{ marginBottom: '10px', padding: '8px', borderRadius: '6px', background: `${def.color}10`, border: `1px solid ${def.color}25` }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {def.emoji} {def.label}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px' }}>{def.desc}</div>
                </div>
              )}
              {renderSettings()}
            </div>
          )}
        </div>
      </div>

      {/* ═══ CENTER PREVIEW ═══ */}
      <div ref={previewRef} style={{ flex: 1, background: '#1a1a2e', overflow: 'auto', position: 'relative' }}>
        {/* Preview Toolbar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0d0d1a', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '6px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>Trang chủ</span>
            <span style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px', color: 'rgba(255,255,255,0.4)' }}>Preview</span>
            <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)' }}>
              {sectionOrder.length} phần • {sectionOrder.filter(id => !sectionVisibility[id]).length} hiện
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {hasChanges && (
              <button onClick={onSave} disabled={saving}
                style={{ background: '#6366f1', border: 'none', color: '#fff', padding: '4px 12px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Save size={11} /> {saving ? 'Lưu...' : 'Lưu'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setLiveSitePreview((v) => !v)}
              style={{ background: liveSitePreview ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Xem trang chủ thật (sau khi lưu)"
            >
              {liveSitePreview ? <PanelRightClose size={10} /> : <PanelRightOpen size={10} />}
              Trang thật
            </button>
            <button onClick={resetAll}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.5)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCcw size={10} /> Reset
            </button>
          </div>
        </div>

        {/* Sections Preview with Drop Zones */}
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
          {/* Top drop zone */}
          <DropZone idx={0} isEmpty={sectionOrder.length === 0} />

          {sectionOrder.map((sectionId, idx) => {
            const sdef = getSectionDef(sectionId); if (!sdef) return null;
            const isHidden = !!sectionVisibility[sectionId];
            const isSelected = selectedSection === sectionId;
            const isDragging = dragType === 'reorder' && dragPayload === sectionId;

            return (
              <div key={sectionId}>
                {/* Section Card */}
                <div
                  draggable
                  onDragStart={(e) => onSectionDragStart(e, idx)}
                  onDragEnd={onDragEnd}
                  onClick={() => { setSelectedSection(sectionId); setSidebarTab('settings'); }}
                  style={{
                    position: 'relative', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                    opacity: isDragging ? 0.2 : isHidden ? 0.25 : 1,
                    filter: isHidden ? 'grayscale(1)' : 'none',
                    outline: isSelected ? `2px solid ${sdef.color}` : '2px solid transparent', outlineOffset: '2px',
                    transition: 'all 0.15s',
                    transform: isDragging ? 'scale(0.97)' : 'none',
                  }}>
                  {/* Overlay Controls */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '4px 8px',
                    background: isSelected ? `${sdef.color}DD` : 'rgba(0,0,0,0.6)',
                    opacity: isSelected ? 1 : 0,
                    transition: 'opacity 0.15s',
                  }} className="section-overlay">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <GripVertical size={12} style={{ color: '#fff', cursor: 'grab', opacity: 0.6 }} />
                      <span style={{ fontSize: '0.65rem', color: '#fff', fontWeight: 600 }}>{sdef.emoji} {sdef.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={(e) => { e.stopPropagation(); moveSection(idx, -1); }} style={ctrlBtn} title="Lên"><ArrowUp size={11} /></button>
                      <button onClick={(e) => { e.stopPropagation(); moveSection(idx, 1); }} style={ctrlBtn} title="Xuống"><ArrowDown size={11} /></button>
                      <button onClick={(e) => { e.stopPropagation(); toggleVisibility(sectionId); }} style={{...ctrlBtn, color: isHidden ? '#f87171' : '#fff'}} title={isHidden?'Hiện':'Ẩn'}>
                        {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); removeSection(sectionId); }} style={{...ctrlBtn, color: '#f87171'}} title="Xóa">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {isHidden && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '0.8rem', fontWeight: 600, gap: '6px' }}>
                      <EyeOff size={16} /> Đã ẩn
                    </div>
                  )}

                  {renderPreview(sectionId)}
                </div>

                {/* Drop zone after this section */}
                <DropZone idx={idx + 1} />
              </div>
            );
          })}

          {/* Bottom "Add Section" button (always visible like Elementor) */}
          {availableWidgets.length > 0 && !dragType && (
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={() => { setSidebarTab('widgets'); }}
                style={{ padding: '10px 24px', borderRadius: '8px', border: '2px dashed rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#818cf8'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
                <Plus size={16} /> Thêm phần mới
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ RIGHT STRUCTURE PANEL ═══ */}
      {showStructure && (
        <div style={{ width: '220px', flexShrink: 0, background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Layers size={13} /> Cấu trúc
            </span>
            <button onClick={() => setShowStructure(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}><X size={14} /></button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
            {sectionOrder.map((id, idx) => {
              const d = getSectionDef(id); if (!d) return null;
              const isHidden = !!sectionVisibility[id];
              const Icon = d.icon;
              return (
                <div key={id}
                  onClick={() => { setSelectedSection(id); setSidebarTab('settings'); }}
                  draggable onDragStart={(e) => onSectionDragStart(e, idx)} onDragEnd={onDragEnd}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
                    borderRadius: '5px', cursor: 'pointer', marginBottom: '1px',
                    background: selectedSection === id ? `${d.color}15` : 'transparent',
                    borderLeft: selectedSection === id ? `2px solid ${d.color}` : '2px solid transparent',
                    opacity: isHidden ? 0.35 : 1,
                    fontSize: '0.7rem', color: 'var(--text)', transition: 'all 0.1s',
                  }}>
                  <Icon size={11} style={{ color: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, textDecoration: isHidden ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</span>
                  {isHidden && <EyeOff size={9} style={{ color: 'var(--danger)', flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
            {sectionOrder.filter(id => !sectionVisibility[id]).length}/{sectionOrder.length} hiển thị
          </div>
        </div>
      )}


      {liveSitePreview && (
        <div className="home-editor-visual-live-preview">
          <HomeEditorPreview activeTab={livePreviewTab} refreshKey={previewRefreshKey} />
        </div>
      )}

      {!showStructure && (
        <button onClick={() => setShowStructure(true)}
          style={{ position: 'fixed', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px 0 0 6px', padding: '8px 4px', cursor: 'pointer', color: 'var(--text-muted)', zIndex: 20 }}>
          <ChevronLeft size={14} />
        </button>
      )}

      <style>{`
        .section-overlay { opacity: 0 !important; transition: opacity 0.15s; }
        div:hover > .section-overlay { opacity: 1 !important; }

        @keyframes dropZonePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
