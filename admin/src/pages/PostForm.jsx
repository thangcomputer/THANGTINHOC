import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, Upload, X, Loader2, Search, Hash, FileText,
  Eye, Globe, ChevronDown, ChevronUp, CheckCircle, AlertTriangle,
  XCircle, Lightbulb, List, Tag, BarChart3, Sparkles, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Loading from '../components/Loading';
import MediaPicker from '../components/MediaPicker';
import { clientPath } from '../lib/clientUrl';

const slugify = (text) => {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

// ── SEO Analysis Engine ──
function analyzeSEO(form) {
  const checks = [];
  const kw = (form.focusKeyword || '').toLowerCase().trim();
  const title = form.title || '';
  const metaTitle = form.metaTitle || title;
  const metaDesc = form.metaDescription || form.excerpt || '';
  const content = form.content || '';
  const slug = form.slug || '';
  const contentLower = content.toLowerCase();
  const titleLower = title.toLowerCase();

  if (!kw) {
    checks.push({ type: 'warning', text: 'Chưa đặt từ khóa trọng tâm', tip: 'Nhập từ khóa chính để phân tích SEO' });
  } else {
    if (titleLower.includes(kw)) {
      checks.push({ type: 'good', text: 'Từ khóa có trong tiêu đề ✓' });
    } else {
      checks.push({ type: 'error', text: 'Từ khóa chưa có trong tiêu đề', tip: `Thêm "${kw}" vào tiêu đề bài viết` });
    }
    const kwSlug = slugify(kw);
    if (slug.includes(kwSlug)) {
      checks.push({ type: 'good', text: 'Từ khóa có trong URL (slug) ✓' });
    } else {
      checks.push({ type: 'warning', text: 'Từ khóa chưa có trong URL', tip: `Nên thêm "${kwSlug}" vào slug` });
    }
    if (metaDesc.toLowerCase().includes(kw)) {
      checks.push({ type: 'good', text: 'Từ khóa có trong Meta Description ✓' });
    } else {
      checks.push({ type: 'warning', text: 'Từ khóa chưa có trong Meta Description', tip: 'Thêm từ khóa vào mô tả meta để tăng SEO' });
    }
    if (contentLower.includes(kw)) {
      const count = (contentLower.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      const density = content.length > 0 ? ((count * kw.length) / content.length * 100).toFixed(1) : 0;
      if (density > 0 && density < 3) {
        checks.push({ type: 'good', text: `Mật độ từ khóa: ${density}% (${count} lần) ✓` });
      } else if (density >= 3) {
        checks.push({ type: 'warning', text: `Mật độ từ khóa quá cao: ${density}%`, tip: 'Giảm bớt số lần lặp từ khóa (nên 0.5-2.5%)' });
      } else {
        checks.push({ type: 'warning', text: 'Từ khóa xuất hiện quá ít trong nội dung', tip: 'Thêm từ khóa tự nhiên vào bài viết' });
      }
    } else {
      checks.push({ type: 'error', text: 'Từ khóa chưa xuất hiện trong nội dung', tip: 'Hãy đề cập từ khóa trong bài viết' });
    }
    const firstPara = content.split('\n')[0]?.toLowerCase() || '';
    if (firstPara.includes(kw)) {
      checks.push({ type: 'good', text: 'Từ khóa trong đoạn mở đầu ✓' });
    } else {
      checks.push({ type: 'warning', text: 'Từ khóa chưa có trong đoạn mở đầu', tip: 'Nên đề cập từ khóa trong 1-2 câu đầu' });
    }
  }

  if (metaTitle.length === 0) {
    checks.push({ type: 'warning', text: 'Chưa có Meta Title', tip: 'Viết meta title 50-60 ký tự' });
  } else if (metaTitle.length < 30) {
    checks.push({ type: 'warning', text: `Meta Title quá ngắn (${metaTitle.length} ký tự)`, tip: 'Nên từ 50-60 ký tự' });
  } else if (metaTitle.length <= 60) {
    checks.push({ type: 'good', text: `Meta Title tốt (${metaTitle.length}/60 ký tự) ✓` });
  } else {
    checks.push({ type: 'warning', text: `Meta Title quá dài (${metaTitle.length}/60 ký tự)`, tip: 'Google sẽ cắt bớt nếu trên 60 ký tự' });
  }

  if (metaDesc.length === 0) {
    checks.push({ type: 'warning', text: 'Chưa có Meta Description', tip: 'Viết 120-160 ký tự mô tả hấp dẫn' });
  } else if (metaDesc.length < 100) {
    checks.push({ type: 'warning', text: `Meta Description ngắn (${metaDesc.length}/160 ký tự)`, tip: 'Nên từ 120-160 ký tự' });
  } else if (metaDesc.length <= 160) {
    checks.push({ type: 'good', text: `Meta Description tốt (${metaDesc.length}/160 ký tự) ✓` });
  } else {
    checks.push({ type: 'warning', text: `Meta Description dài (${metaDesc.length}/160 ký tự)`, tip: 'Google sẽ cắt bớt sau 160 ký tự' });
  }

  const wordCount = content.trim().split(/\s+/).length;
  if (wordCount < 100) {
    checks.push({ type: 'error', text: `Nội dung quá ngắn (${wordCount} từ)`, tip: 'Viết ít nhất 300 từ để SEO tốt' });
  } else if (wordCount < 300) {
    checks.push({ type: 'warning', text: `Nội dung hơi ngắn (${wordCount} từ)`, tip: 'Nên viết 300+ từ' });
  } else {
    checks.push({ type: 'good', text: `Độ dài nội dung tốt (${wordCount} từ) ✓` });
  }

  const hasH2 = /^##\s/m.test(content) || /<h[23]/i.test(content);
  if (hasH2) {
    checks.push({ type: 'good', text: 'Có heading phụ (H2/H3) ✓' });
  } else {
    checks.push({ type: 'warning', text: 'Chưa có heading phụ (H2/H3)', tip: 'Thêm ## Heading để cấu trúc bài viết' });
  }

  const hasImage = form.thumbnail || /!\[.*\]\(.*\)/m.test(content) || /<img/i.test(content);
  if (hasImage) {
    checks.push({ type: 'good', text: 'Có ảnh minh họa ✓' });
  } else {
    checks.push({ type: 'warning', text: 'Chưa có ảnh minh họa', tip: 'Thêm ảnh bìa hoặc ảnh trong bài để tăng tương tác' });
  }

  if (form.excerpt && form.excerpt.length > 20) {
    checks.push({ type: 'good', text: 'Có tóm tắt bài viết ✓' });
  } else {
    checks.push({ type: 'warning', text: 'Chưa có tóm tắt', tip: 'Viết đoạn trích dẫn ngắn cho danh sách blog' });
  }

  const good = checks.filter(c => c.type === 'good').length;
  const total = checks.length;
  const score = total > 0 ? Math.round((good / total) * 100) : 0;
  return { checks, score, good, total };
}

function generateTOC(content) {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const toc = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = slugify(text);
    toc.push({ id, text, level });
  }
  const htmlRegex = /<h([2-4])[^>]*>(.*?)<\/h[2-4]>/gi;
  while ((match = htmlRegex.exec(content)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    const id = slugify(text);
    toc.push({ id, text, level });
  }
  return toc;
}

export default function PostForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [seoOpen, setSeoOpen] = useState(true);
  const [tocOpen, setTocOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const quillRef = useRef(null);
  const textareaRef = useRef(null);
  const [cursorPos, setCursorPos] = useState(null);
  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', content: '', categoryId: '', thumbnail: '',
    isPublished: false, isFeatured: false, noIndex: false,
    canonicalUrl: '',
    metaTitle: '', metaDescription: '', focusKeyword: '', tags: '[]', tableOfContents: '[]'
  });
  const [aiSourceInfo, setAiSourceInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'seo') setSeoOpen(true);
  }, [activeTab]);

  // ── IMAGE INSERT MODAL ──
  const [imgModalOpen, setImgModalOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState('');
  const [imgCaption, setImgCaption] = useState('');
  const [imgUploading, setImgUploading] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const openImageModal = () => {
    // Save cursor position before opening modal
    if (textareaRef.current) {
      setCursorPos({
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd,
      });
    }
    setImgUrl('');
    setImgCaption('');
    setImgModalOpen(true);
  };

  const handleImageUploadForContent = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload', fd);
      setImgUrl(res.data.data.url);
      toast.success('Tải ảnh thành công!');
    } catch { toast.error('Lỗi khi tải ảnh'); }
    finally { setImgUploading(false); }
  };

  const insertImageToContent = () => {
    if (!imgUrl) return toast.error('Vui lòng chọn hoặc nhập URL ảnh');
    const caption = imgCaption.trim();
    const html = caption
      ? `\n<figure>\n  <img src="${imgUrl}" alt="${caption}" />\n  <figcaption>${caption}</figcaption>\n</figure>\n`
      : `\n<img src="${imgUrl}" alt="" />\n`;

    const content = form.content || '';
    const pos = cursorPos || { start: content.length, end: content.length };
    const newContent = content.slice(0, pos.start) + html + content.slice(pos.end);
    setForm({ ...form, content: newContent });
    setImgModalOpen(false);
    toast.success('Đã chèn ảnh vào nội dung!');
    // Restore focus + cursor after layout update
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = pos.start + html.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 50);
  };

  // Insert HTML snippet at cursor in textarea
  const insertSnippet = (before, after = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = form.content.slice(start, end);
    const snippet = before + (selected || 'Nội dung') + after;
    const newContent = form.content.slice(0, start) + snippet + form.content.slice(end);
    setForm({ ...form, content: newContent });
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + (selected || 'Nội dung').length);
    }, 10);
  };

  // ── AI Generate ──
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStep, setAiStep] = useState('');
  const [aiResults, setAiResults] = useState([]);
  const [aiSelectedIdx, setAiSelectedIdx] = useState(-1);
  const [aiPreviewIdx, setAiPreviewIdx] = useState(-1);

  // Smart suggestions database
  const SUGGESTION_DB = [
    'Hướng dẫn học Excel từ cơ bản đến nâng cao',
    'Hướng dẫn học Excel cho người mới bắt đầu',
    'Các hàm Excel thông dụng nhất cần biết',
    'Cách dùng VLOOKUP trong Excel hiệu quả',
    'Pivot Table trong Excel - Hướng dẫn chi tiết',
    'Tin học văn phòng cơ bản cho người đi làm',
    'Các phím tắt Excel giúp làm việc nhanh hơn',
    'Cách tạo biểu đồ đẹp trong Excel',
    'Word cơ bản cho người mới học',
    'Cách trình bày văn bản chuyên nghiệp trong Word',
    'Mail Merge trong Word - Hướng dẫn đầy đủ',
    'Thiết kế slide PowerPoint đẹp và chuyên nghiệp',
    'Google Sheets vs Excel - So sánh chi tiết',
    'Hướng dẫn dùng Google Sheets cơ bản',
    'Cách học lập trình Python cho người mới',
    'Python cơ bản - các khái niệm cần nắm',
    'SEO là gì? Hướng dẫn tối ưu website lên Google',
    'Cách viết bài chuẩn SEO thu hút người đọc',
    'Từ khóa SEO và cách nghiên cứu từ khóa hiệu quả',
    'Cách tăng tốc độ website để cải thiện SEO',
    'Microsoft Office 365 - Hướng dẫn sử dụng toàn diện',
    'Cách bảo vệ file Excel bằng mật khẩu',
    'Học lập trình HTML CSS cho người mới hoàn toàn',
    'JavaScript cơ bản - Bắt đầu từ đâu?',
    'Cách sử dụng ChatGPT hiệu quả trong công việc',
    'Trí tuệ nhân tạo AI là gì? Ứng dụng trong thực tế',
    'Cách quản lý dữ liệu với Excel nâng cao',
    'Hướng dẫn in ấn chuyên nghiệp trong Excel và Word',
    'Cách học đánh máy 10 ngón nhanh chóng',
    'Bảo mật thông tin cá nhân trên internet',
    'Cách dùng Canva thiết kế chuyên nghiệp miễn phí',
    'Google Drive - Lưu trữ và chia sẻ file hiệu quả',
    'Zoom - Hướng dẫn họp trực tuyến chuyên nghiệp',
    'Cách tạo CV xin việc chuyên nghiệp bằng Word',
    'Top phần mềm kế toán phổ biến nhất hiện nay',
    'Hướng dẫn dùng phần mềm MISA cho người mới',
  ];

  // Dynamic suggestions based on topic input
  const dynamicSuggestions = useMemo(() => {
    const kw = aiTopic.trim().toLowerCase();
    if (!kw) {
      return SUGGESTION_DB.slice(0, 6);
    }
    // Score each suggestion by relevance
    const scored = SUGGESTION_DB.map(s => {
      const sl = s.toLowerCase();
      let score = 0;
      const words = kw.split(/\s+/);
      words.forEach(w => { if (w.length > 1 && sl.includes(w)) score += 2; });
      if (sl.startsWith(kw)) score += 5;
      if (sl.includes(kw)) score += 3;
      return { s, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

    if (scored.length >= 3) return scored.slice(0, 6).map(x => x.s);

    // Generate smart completions if no match
    const completions = [
      `Hướng dẫn ${aiTopic} từ cơ bản đến nâng cao`,
      `${aiTopic} cho người mới bắt đầu`,
      `Cách học ${aiTopic} hiệu quả nhanh nhất`,
      `${aiTopic} - Tất cả những gì bạn cần biết`,
      `Top 10 mẹo ${aiTopic} giúp tiết kiệm thời gian`,
      `${aiTopic} là gì? Hướng dẫn chi tiết đầy đủ`,
    ];
    return [...scored.map(x => x.s), ...completions].slice(0, 6);
  }, [aiTopic]);

  useEffect(() => {
    api.get('/stats/categories?type=post').then(res => setCategories(res.data.data || []));
    if (id) {
      setLoading(true);
      api.get(`/posts/admin/${id}`).then(res => {
        const data = res.data.data;
        setForm({
          ...data,
          metaTitle: data.metaTitle || '',
          metaDescription: data.metaDescription || '',
          focusKeyword: data.focusKeyword || '',
          tags: data.tags || '[]',
          tableOfContents: data.tableOfContents || '[]',
        });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const tags = useMemo(() => {
    try { return JSON.parse(form.tags || '[]'); } catch { return []; }
  }, [form.tags]);

  const addTag = (tag) => {
    const t = tag.trim().replace(/^#/, '');
    if (!t || tags.includes(t)) return;
    setForm({ ...form, tags: JSON.stringify([...tags, t]) });
    setTagInput('');
  };

  const removeTag = (idx) => {
    const newTags = tags.filter((_, i) => i !== idx);
    setForm({ ...form, tags: JSON.stringify(newTags) });
  };

  const toc = useMemo(() => generateTOC(form.content), [form.content]);
  const seo = useMemo(() => analyzeSEO(form), [form]);

  const persistPost = useCallback(async ({ publish, redirect = true }) => {
    if (!form.title || !form.slug || !form.categoryId) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return false;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        isPublished: publish ? form.isPublished : false,
        tableOfContents: JSON.stringify(toc),
      };
      if (id) await api.put(`/posts/${id}`, payload);
      else await api.post('/posts', payload);
      toast.success(publish ? 'Lưu thành công' : 'Đã lưu nháp (Ctrl+S)');
      if (redirect) navigate('/posts');
      return true;
    } catch {
      toast.error('Lỗi khi lưu');
      return false;
    } finally {
      setSaving(false);
    }
  }, [form, toc, id, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    await persistPost({ publish: true, redirect: true });
  };

  const handleSaveDraft = useCallback(() => {
    persistPost({ publish: false, redirect: false });
  }, [persistPost]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSaveDraft]);

  const [gallery, setGallery] = useState([]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const uploaded = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await api.post('/upload', formData);
        uploaded.push({ url: res.data.data.url, title: '', alt: '' });
      } catch {
        toast.error(`Lỗi khi tải ảnh ${file.name}`);
      }
    }
    if (uploaded.length) {
      setGallery(prev => [...prev, ...uploaded]);
      toast.success('Tải ảnh thành công');
    }
  };

  const imageHandler = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await api.post('/upload', formData);
        const url = res.data.data.url;
        const editor = quillRef.current?.getEditor();
        if (editor) {
          const range = editor.getSelection();
          if (range) {
            editor.insertEmbed(range.index, 'image', url);
            editor.setSelection(range.index + 1);
          } else {
            editor.insertEmbed(editor.getLength() - 1, 'image', url);
          }
        }
        toast.success('Đã chèn ảnh vào nội dung!');
      } catch {
        toast.error('Lỗi khi tải ảnh');
      }
    };
  };

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean'],
      ],
      handlers: { image: imageHandler },
    },
  }), []);

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'align',
    'list', 'bullet', 'blockquote', 'code-block',
    'link', 'image', 'video',
  ];

  const scoreColor = seo.score >= 80 ? '#10b981' : seo.score >= 50 ? '#f59e0b' : '#ef4444';
  const scoreLabel = seo.score >= 80 ? 'Tốt' : seo.score >= 50 ? 'Cần cải thiện' : 'Yếu';

  // ── AI Generate: tạo bài, lưu vào mảng results ──
  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) return toast.error('Vui lòng nhập chủ đề bài viết');
    if (categories.length === 0) return toast.error('Chưa có danh mục. Hãy tạo danh mục trước!');

    setAiGenerating(true);
    setAiStep('🔍 Đang tìm kiếm dữ liệu Google...');
    try {
      await new Promise(r => setTimeout(r, 800));
      setAiStep('🤖 AI đang nghiên cứu chủ đề...');
      await new Promise(r => setTimeout(r, 600));
      setAiStep(`✍️ AI đang viết phiên bản ${aiResults.length + 1}...`);

      const res = await api.post('/ai/generate-post', { topic: aiTopic });
      const { data: d, source, sourceInfo, elapsed } = res.data;

      const wordCount = (d.content || '').replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
      const newResult = { ...d, source, sourceInfo, elapsed, wordCount, createdAt: new Date().toLocaleTimeString('vi-VN') };

      setAiResults(prev => [...prev, newResult]);
      setAiSelectedIdx(aiResults.length);
      setAiStep('');
      toast.success(`✅ Phiên bản ${aiResults.length + 1} đã sẵn sàng!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo bài viết, vui lòng thử lại');
    } finally {
      setAiGenerating(false);
      setAiStep('');
    }
  };

  // Apply selected AI result to form
  const handleAiApply = () => {
    if (aiSelectedIdx < 0 || !aiResults[aiSelectedIdx]) return;
    const d = aiResults[aiSelectedIdx];
    const catId = form.categoryId || categories[0]?.id || '';
    setForm({
      title: d.title, slug: d.slug, excerpt: d.excerpt, content: d.content,
      categoryId: catId, thumbnail: '', isPublished: true, isFeatured: false,
      noIndex: false, canonicalUrl: '',
      metaTitle: d.metaTitle, metaDescription: d.metaDescription,
      focusKeyword: d.focusKeyword, tags: JSON.stringify(d.tags || []), tableOfContents: '[]',
    });
    setAiSourceInfo({ source: d.source, sourceInfo: d.sourceInfo, elapsed: d.elapsed });
    setAiModalOpen(false);
    setAiResults([]);
    setAiTopic('');
    setAiSelectedIdx(-1);
    toast.success('✅ Đã áp dụng bài viết! Kiểm tra và nhấn Lưu để xuất bản.', { duration: 5000 });
  };

  // Remove one AI result
  const removeAiResult = (idx) => {
    setAiResults(prev => prev.filter((_, i) => i !== idx));
    if (aiSelectedIdx === idx) setAiSelectedIdx(-1);
    else if (aiSelectedIdx > idx) setAiSelectedIdx(aiSelectedIdx - 1);
  };


  if (loading) return <Loading fullPage message="Đang tải bài viết..." />;

  return (
    <div className="animate-fade-in">

      {/* ── IMAGE INSERT MODAL ── */}
      {imgModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={e => { if (e.target === e.currentTarget) setImgModalOpen(false); }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: '16px', padding: '28px',
            width: '460px', maxWidth: '92vw',
            border: '1px solid rgba(59,130,246,0.3)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
              }}>🖼️</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Chèn Ảnh Vào Nội Dung</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Upload ảnh hoặc dùng URL · Thêm ghi chú bên dưới ảnh
                </p>
              </div>
            </div>

            {/* Upload Button */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '10px', borderRadius: '8px', cursor: 'pointer',
                border: '2px dashed rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.05)',
                color: 'var(--primary-light)', fontWeight: 600, fontSize: '0.85rem',
                transition: '0.15s',
              }}>
                {imgUploading
                  ? <><Loader2 size={16} className="spinner" /> Đang tải lên...</>
                  : <>📤 Tải ảnh từ máy tính</>
                }
                <input type="file" hidden accept="image/*,.webp" onChange={handleImageUploadForContent} disabled={imgUploading} />
              </label>
            </div>

            {/* OR divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>HOẶC NHẬP URL</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            {/* URL Input */}
            <div className="form-group">
              <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>🔗 URL ảnh</label>
              <input
                type="text"
                className="form-control"
                placeholder="https://example.com/image.jpg"
                value={imgUrl}
                onChange={e => setImgUrl(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            {/* Preview */}
            {imgUrl && (
              <div style={{
                marginBottom: '14px', borderRadius: '8px', overflow: 'hidden',
                border: '1px solid var(--border)', background: 'var(--bg-subtle)',
                maxHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img
                  src={imgUrl}
                  alt="preview"
                  style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {/* Caption */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                📝 Ghi chú dưới ảnh <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(tuỳ chọn)</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="VD: Chọn thẻ Sheet và thiết lập vùng in..."
                value={imgCaption}
                onChange={e => setImgCaption(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') insertImageToContent(); }}
                style={{ fontSize: '0.85rem' }}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                Ghi chú sẽ hiển thị italic bên dưới ảnh (như ảnh hướng dẫn)
              </small>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setImgModalOpen(false)}>
                <X size={15} /> Hủy
              </button>
              <button
                onClick={insertImageToContent}
                disabled={!imgUrl}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '9px 18px', borderRadius: '8px', border: 'none',
                  background: imgUrl ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(99,102,241,0.3)',
                  color: 'white', fontWeight: 700, fontSize: '0.88rem',
                  cursor: imgUrl ? 'pointer' : 'not-allowed',
                }}
              >
                🖼️ Chèn Vào Nội Dung
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI MODAL ── */}
      {aiModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }} onClick={e => { if (e.target === e.currentTarget && !aiGenerating) setAiModalOpen(false); }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: '16px', padding: '28px',
            width: aiResults.length > 0 ? '720px' : '480px', maxWidth: '95vw',
            maxHeight: '90vh', overflowY: 'auto',
            border: '1px solid rgba(139,92,246,0.3)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            transition: 'width 0.3s',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={22} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>✨ Tạo Bài Viết SEO Bằng AI</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Tạo tối đa 3 phiên bản · Chọn bài ưng ý nhất
                </p>
              </div>
              {!aiGenerating && (
                <button onClick={() => { setAiModalOpen(false); setAiResults([]); setAiSelectedIdx(-1); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Topic Input */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>💡 Chủ đề bài viết</label>
              <input
                type="text" className="form-control"
                placeholder="VD: Hướng dẫn học Excel cho người mới bắt đầu..."
                value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !aiGenerating) handleAiGenerate(); }}
                disabled={aiGenerating} autoFocus
                style={{ fontSize: '0.92rem', padding: '11px 14px' }}
              />
            </div>

            {/* Suggestions - only show when no results yet */}
            {aiResults.length === 0 && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  💬 {aiTopic.trim() ? 'Gợi ý:' : 'Gợi ý chủ đề phổ biến:'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {dynamicSuggestions.map((s, i) => (
                    <button key={i} onClick={() => setAiTopic(s)} disabled={aiGenerating} title={s}
                      style={{
                        padding: '4px 10px', borderRadius: '18px',
                        border: `1px solid ${aiTopic === s ? 'rgba(139,92,246,0.5)' : 'var(--border)'}`,
                        background: aiTopic === s ? 'rgba(139,92,246,0.15)' : 'var(--bg-subtle)',
                        color: aiTopic === s ? '#a78bfa' : 'var(--text-secondary)',
                        fontSize: '0.7rem', cursor: 'pointer', transition: '0.15s',
                        maxWidth: '190px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >{s}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Status */}
            {aiGenerating && (
              <div style={{
                padding: '12px 16px', borderRadius: '10px', marginBottom: '14px',
                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <Loader2 size={16} className="spinner" style={{ color: '#a78bfa' }} />
                <span style={{ fontSize: '0.85rem', color: '#a78bfa', fontWeight: 600 }}>{aiStep}</span>
              </div>
            )}

            {/* ── RESULT CARDS ── */}
            {aiResults.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📋 Kết quả ({aiResults.length}) — Click để xem trước nội dung
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {aiResults.map((r, idx) => (
                    <div
                      key={idx}
                      onClick={() => setAiPreviewIdx(idx)}
                      style={{
                        padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                        border: aiSelectedIdx === idx
                          ? '2px solid #8b5cf6'
                          : '1px solid var(--border)',
                        background: aiSelectedIdx === idx
                          ? 'rgba(139,92,246,0.08)'
                          : 'var(--bg-subtle)',
                        transition: 'all 0.2s',
                        position: 'relative',
                      }}
                    >
                      {/* Preview hint */}
                      <div style={{
                        position: 'absolute', top: '-6px', right: '10px',
                        background: aiSelectedIdx === idx ? '#8b5cf6' : '#3b82f6',
                        color: 'white', fontSize: '0.62rem', fontWeight: 700,
                        padding: '2px 8px', borderRadius: '10px',
                      }}>{aiSelectedIdx === idx ? '✓ Đã chọn' : '👁 Click xem'}</div>

                      {/* Remove button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeAiResult(idx); }}
                        style={{
                          position: 'absolute', top: '8px', right: '8px',
                          background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px',
                          color: '#ef4444', cursor: 'pointer', padding: '2px 6px', fontSize: '0.7rem',
                        }}
                      ><X size={12} /></button>

                      {/* Version badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700,
                          background: idx === 0 ? '#3b82f620' : idx === 1 ? '#10b98120' : '#f59e0b20',
                          color: idx === 0 ? '#3b82f6' : idx === 1 ? '#10b981' : '#f59e0b',
                        }}>Phiên bản {idx + 1}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {r.wordCount} từ · {r.source} · {r.elapsed || ''}
                        </span>
                      </div>

                      {/* Title */}
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px', lineHeight: 1.3 }}>
                        {r.title}
                      </div>

                      {/* Excerpt */}
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        {(r.excerpt || '').slice(0, 150)}{(r.excerpt || '').length > 150 ? '...' : ''}
                      </div>

                      {/* Tags */}
                      {r.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {(r.tags || []).slice(0, 4).map((t, ti) => (
                            <span key={ti} style={{
                              padding: '1px 7px', borderRadius: '10px', fontSize: '0.62rem',
                              background: 'rgba(139,92,246,0.1)', color: '#a78bfa', fontWeight: 600,
                            }}>#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PREVIEW MODAL ── */}
            {aiPreviewIdx >= 0 && aiResults[aiPreviewIdx] && (
              <div style={{
                position: 'fixed', inset: 0, zIndex: 1100,
                background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
              }} onClick={e => { if (e.target === e.currentTarget) setAiPreviewIdx(-1); }}>
                <div style={{
                  background: 'var(--bg-card)', borderRadius: '16px',
                  width: '860px', maxWidth: '95vw', maxHeight: '88vh',
                  display: 'flex', flexDirection: 'column',
                  border: '1px solid rgba(139,92,246,0.3)',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
                  overflow: 'hidden',
                }}>
                  {/* Preview Header */}
                  <div style={{
                    padding: '18px 24px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    background: 'var(--bg-subtle)', flexShrink: 0,
                  }}>
                    <Eye size={20} style={{ color: '#8b5cf6' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>Xem trước — Phiên bản {aiPreviewIdx + 1}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {aiResults[aiPreviewIdx].wordCount} từ · {aiResults[aiPreviewIdx].source} · {aiResults[aiPreviewIdx].elapsed || ''}
                      </div>
                    </div>
                    <button onClick={() => setAiPreviewIdx(-1)} style={{
                      background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                    }}><X size={20} /></button>
                  </div>

                  {/* Preview Content */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                    {/* Title */}
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginBottom: '10px', lineHeight: 1.3 }}>
                      {aiResults[aiPreviewIdx].title}
                    </h1>

                    {/* Meta info */}
                    <div style={{
                      display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px',
                      padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-subtle)',
                      fontSize: '0.72rem', color: 'var(--text-secondary)',
                    }}>
                      <span>🔑 <strong>{aiResults[aiPreviewIdx].focusKeyword}</strong></span>
                      <span>📝 Meta: {(aiResults[aiPreviewIdx].metaDescription || '').slice(0, 80)}...</span>
                    </div>

                    {/* Tags */}
                    {aiResults[aiPreviewIdx].tags?.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
                        {aiResults[aiPreviewIdx].tags.map((t, ti) => (
                          <span key={ti} style={{
                            padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem',
                            background: 'rgba(139,92,246,0.1)', color: '#a78bfa', fontWeight: 600,
                          }}>#{t}</span>
                        ))}
                      </div>
                    )}

                    {/* Divider */}
                    <div style={{ height: '1px', background: 'var(--border)', marginBottom: '18px' }} />

                    {/* Full HTML Content */}
                    <div
                      className="bd-content"
                      style={{ fontSize: '0.92rem', lineHeight: 1.75, color: 'var(--text)' }}
                      dangerouslySetInnerHTML={{ __html: aiResults[aiPreviewIdx].content }}
                    />
                  </div>

                  {/* Preview Footer */}
                  <div style={{
                    padding: '14px 24px', borderTop: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--bg-subtle)', flexShrink: 0,
                  }}>
                    <button onClick={() => setAiPreviewIdx(-1)} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 16px', borderRadius: '8px',
                      border: '1px solid var(--border)', background: 'var(--bg-card)',
                      color: 'var(--text)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                    }}>
                      <ArrowLeft size={14} /> Quay lại so sánh
                    </button>
                    <button onClick={() => { setAiSelectedIdx(aiPreviewIdx); setAiPreviewIdx(-1); }} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 24px', borderRadius: '8px', border: 'none',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                    }}>
                      <CheckCircle size={16} /> Chọn Bài Này
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {aiResults.length > 0 && (
                <button
                  onClick={handleAiGenerate}
                  disabled={aiGenerating || !aiTopic.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '9px 16px', borderRadius: '8px',
                    border: '1px solid var(--border)', background: 'var(--bg-subtle)',
                    color: 'var(--text)', fontWeight: 600, fontSize: '0.82rem',
                    cursor: aiGenerating ? 'not-allowed' : 'pointer', opacity: aiGenerating ? 0.5 : 1,
                  }}
                >
                  {aiGenerating
                    ? <><Loader2 size={14} className="spinner" /> Đang tạo...</>
                    : <>🔄 Tạo Thêm ({aiResults.length})</>
                  }
                </button>
              )}

              {aiResults.length === 0 && (
                <button
                  onClick={handleAiGenerate}
                  disabled={aiGenerating || !aiTopic.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 20px', borderRadius: '8px', border: 'none',
                    background: !aiTopic.trim() || aiGenerating
                      ? 'rgba(139,92,246,0.4)'
                      : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    color: 'white', fontWeight: 700, fontSize: '0.9rem',
                    cursor: aiGenerating || !aiTopic.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {aiGenerating
                    ? <><Loader2 size={16} className="spinner" /> Đang tạo...</>
                    : <><Sparkles size={16} /> Tạo Bài Viết</>
                  }
                </button>
              )}

              {aiResults.length > 0 && (
                <button
                  onClick={handleAiApply}
                  disabled={aiSelectedIdx < 0}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 22px', borderRadius: '8px', border: 'none',
                    background: aiSelectedIdx >= 0
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'rgba(16,185,129,0.3)',
                    color: 'white', fontWeight: 700, fontSize: '0.88rem',
                    cursor: aiSelectedIdx >= 0 ? 'pointer' : 'not-allowed',
                  }}
                >
                  <CheckCircle size={16} /> Áp Dụng Bài Đã Chọn
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="page-title">
          <Link to="/posts" className="btn btn-secondary btn-sm" style={{ marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Quay Lại
          </Link>
          <h1>{id ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Ctrl+S lưu nháp</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowMobilePreview((v) => !v)}>
            {showMobilePreview ? 'Ẩn preview mobile' : 'Preview mobile'}
          </button>
          {/* SEO Score Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', borderRadius: '99px',
            background: `${scoreColor}15`, border: `1px solid ${scoreColor}40`,
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              border: `3px solid ${scoreColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: 800, color: scoreColor,
            }}>{seo.score}</div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: scoreColor }}>{scoreLabel}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>SEO Score</div>
            </div>
          </div>

          {/* Gemini AI Button — only on new post */}
          {!id && (
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '9px 18px', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                color: 'white', fontWeight: 700, fontSize: '0.85rem',
                cursor: 'pointer', transition: '0.2s',
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'none'}
            >
              <Sparkles size={16} /> ✨ Gemini AI Tạo Bài
            </button>
          )}

          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            {saving ? <><Loader2 size={16} className="spinner" /> Đang lưu...</> : <><Save size={18} /> Lưu Bài Viết</>}
          </button>
        </div>
      </div>

      {showMobilePreview && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3 className="card-title">Preview mobile (blog)</h3>
            <a href={clientPath(`/blog/${form.slug || 'preview'}`)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">Mở trên web</a>
          </div>
          <div className="card-body">
            <div className="blog-mobile-preview">
              <div className="blog-mobile-preview-inner">
                {form.thumbnail && <img src={form.thumbnail} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 12 }} />}
                <h2 style={{ fontSize: '1.1rem', margin: '0 0 8px' }}>{form.title || 'Tiêu đề bài viết'}</h2>
                <div dangerouslySetInnerHTML={{ __html: form.content || '<p>Nội dung...</p>' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-form-tabs" role="tablist">
        {[
          { id: 'content', label: 'Nội dung' },
          { id: 'seo', label: 'SEO' },
          { id: 'publish', label: 'Xuất bản' },
          ...(!id ? [{ id: 'ai', label: 'AI' }] : []),
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`admin-form-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {/* ═══ LEFT COLUMN ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className={activeTab === 'publish' || activeTab === 'ai' ? 'post-form-panel-hidden' : ''}>
          {/* Content Card */}
          <div className={`card ${activeTab !== 'content' ? 'post-form-panel-hidden' : ''}`}>
            <div className="card-header"><h3 className="card-title"><FileText size={16} /> Nội Dung Bài Viết</h3></div>
            <div className="card-body">
              <div className="form-group">
                <label>Tiêu Đề *</label>
                <input
                  type="text" className="form-control" value={form.title} required
                  placeholder="Nhập tiêu đề bài viết..."
                  onChange={e => {
                    const title = e.target.value;
                    setForm({ ...form, title, slug: id ? form.slug : slugify(title) });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Slug *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <Globe size={12} /> thangtin.com/blog/<strong style={{ color: 'var(--primary)' }}>{form.slug || '...'}</strong>
                </div>
                <input type="text" className="form-control" value={form.slug} required onChange={e => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Tóm Tắt</label>
                <textarea className="form-control" rows="3" value={form.excerpt || ''} onChange={e => setForm({ ...form, excerpt: e.target.value })} placeholder="Tóm tắt ngắn gọn hiển thị trên danh sách blog..." />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Nội dung chi tiết</span>
                </label>

                {/* ── Content Toolbar ── */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap',
                  padding: '6px 10px', background: 'var(--bg-card2)',
                  border: '1px solid var(--border)', borderBottom: 'none',
                  borderRadius: 'var(--radius) var(--radius) 0 0',
                }}>
                  {/* Image Insert */}
                  <button type="button" title="Chèn ảnh vào nội dung"
                    onClick={openImageModal}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '5px 10px', borderRadius: '6px', border: 'none',
                      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                      color: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                    }}>
                    🖼️ Chèn Ảnh
                  </button>

                  <div style={{ width: '1px', height: '22px', background: 'var(--border)', margin: '0 3px' }} />

                  {/* H2 */}
                  <button type="button" title="Chèn tiêu đề H2"
                    onClick={() => insertSnippet('\n<h2>', '</h2>\n')}
                    style={{ padding: '4px 9px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                    H2
                  </button>
                  {/* H3 */}
                  <button type="button" title="Chèn tiêu đề H3"
                    onClick={() => insertSnippet('\n<h3>', '</h3>\n')}
                    style={{ padding: '4px 9px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                    H3
                  </button>
                  {/* Bold */}
                  <button type="button" title="In đậm"
                    onClick={() => insertSnippet('<strong>', '</strong>')}
                    style={{ padding: '4px 9px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', fontSize: '0.78rem', fontWeight: 900, cursor: 'pointer' }}>
                    B
                  </button>
                  {/* List */}
                  <button type="button" title="Danh sách"
                    onClick={() => insertSnippet('\n<ul>\n  <li>', '</li>\n  <li>...</li>\n</ul>\n')}
                    style={{ padding: '4px 9px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', fontSize: '0.78rem', cursor: 'pointer' }}>
                    • List
                  </button>
                  {/* Code */}
                  <button type="button" title="Code"
                    onClick={() => insertSnippet('<code>', '</code>')}
                    style={{ padding: '4px 9px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: '#a78bfa', fontSize: '0.78rem', fontFamily: 'monospace', cursor: 'pointer' }}>
                    {'</>'}  
                  </button>

                  <div style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {(form.content || '').replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length} từ
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  className="form-control"
                  rows={14}
                  value={form.content || ''}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Nhập nội dung bài viết HTML... Dùng toolbar trên để chèn ảnh, heading, bold..."
                  style={{ minHeight: '400px', resize: 'vertical', borderRadius: '0 0 var(--radius) var(--radius)', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.6 }}
                />
              </div>
            </div>
          </div>

          {/* ═══ SEO PANEL ═══ */}
          <div className={`card ${activeTab !== 'seo' ? 'post-form-panel-hidden' : ''}`} style={{ border: `1px solid ${scoreColor}30` }}>
            <div className="card-header" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => setSeoOpen(!seoOpen)}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={16} style={{ color: scoreColor }} />
                <span>Tối Ưu SEO</span>
                <span style={{
                  background: `${scoreColor}15`, color: scoreColor, padding: '2px 10px',
                  borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700, marginLeft: '4px',
                }}>{seo.score}/100 — {scoreLabel}</span>
              </h3>
              {seoOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            {seoOpen && (
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '14px', borderRadius: 'var(--radius)', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text)' }}>
                    <Search size={14} /> Từ Khóa Trọng Tâm (Focus Keyword)
                  </label>
                  <input
                    type="text" className="form-control" value={form.focusKeyword || ''}
                    onChange={e => setForm({ ...form, focusKeyword: e.target.value })}
                    placeholder="VD: học excel online, tin học văn phòng..."
                    style={{ fontSize: '0.9rem', fontWeight: 600 }}
                  />
                  <small style={{ display: 'block', marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    💡 Từ khóa chính mà bạn muốn bài viết xếp hạng trên Google
                  </small>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    Meta Title
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 600, padding: '1px 6px', borderRadius: '4px',
                      background: (form.metaTitle || form.title).length <= 60 ? '#10b98120' : '#f59e0b20',
                      color: (form.metaTitle || form.title).length <= 60 ? '#10b981' : '#f59e0b',
                    }}>{(form.metaTitle || form.title).length}/60</span>
                  </label>
                  <input type="text" className="form-control" value={form.metaTitle}
                    onChange={e => setForm({ ...form, metaTitle: e.target.value })}
                    placeholder={form.title || 'Tiêu đề hiển thị trên Google...'}
                  />
                  <div style={{ height: '3px', borderRadius: '2px', marginTop: '4px', background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '2px', transition: 'width 0.3s',
                      width: `${Math.min(100, ((form.metaTitle || form.title).length / 60) * 100)}%`,
                      background: (form.metaTitle || form.title).length <= 60 ? '#10b981' : '#ef4444',
                    }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    Meta Description
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 600, padding: '1px 6px', borderRadius: '4px',
                      background: (form.metaDescription).length <= 160 ? '#10b98120' : '#f59e0b20',
                      color: (form.metaDescription).length <= 160 ? '#10b981' : '#f59e0b',
                    }}>{form.metaDescription.length}/160</span>
                  </label>
                  <textarea className="form-control" rows="3" value={form.metaDescription}
                    onChange={e => setForm({ ...form, metaDescription: e.target.value })}
                    placeholder="Mô tả ngắn gọn hiển thị trên kết quả Google..."
                  />
                  <div style={{ height: '3px', borderRadius: '2px', marginTop: '4px', background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '2px', transition: 'width 0.3s',
                      width: `${Math.min(100, (form.metaDescription.length / 160) * 100)}%`,
                      background: form.metaDescription.length <= 160 ? '#10b981' : '#ef4444',
                    }} />
                  </div>
                </div>

                {/* Google Preview */}
                <div style={{ padding: '14px 16px', borderRadius: '8px', background: '#fff', border: '1px solid #e0e0e0' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#70757a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={11} /> Xem trước trên Google
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 400, color: '#1a0dab', lineHeight: 1.3, marginBottom: '2px', cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}>
                    {(form.metaTitle || form.title || 'Tiêu đề bài viết...').slice(0, 60)}{(form.metaTitle || form.title || '').length > 60 ? '...' : ''}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#006621', marginBottom: '2px', fontFamily: 'Arial, sans-serif' }}>
                    thangtin.com/blog/{form.slug || '...'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#4d5156', lineHeight: 1.45, fontFamily: 'Arial, sans-serif' }}>
                    {(form.metaDescription || form.excerpt || 'Mô tả sẽ hiển thị ở đây khi bài viết xuất hiện trên Google...').slice(0, 160)}{(form.metaDescription || form.excerpt || '').length > 160 ? '...' : ''}
                  </div>
                </div>

                {/* SEO Checklist */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart3 size={14} /> Phân Tích SEO ({seo.good}/{seo.total} tốt)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {seo.checks.map((c, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 10px',
                        borderRadius: '6px', fontSize: '0.78rem',
                        background: c.type === 'good' ? '#10b98108' : c.type === 'error' ? '#ef444408' : '#f59e0b08',
                      }}>
                        {c.type === 'good' && <CheckCircle size={14} style={{ color: '#10b981', flexShrink: 0, marginTop: '1px' }} />}
                        {c.type === 'warning' && <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />}
                        {c.type === 'error' && <XCircle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />}
                        <div>
                          <span style={{ color: 'var(--text)', fontWeight: 500 }}>{c.text}</span>
                          {c.tip && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>💡 {c.tip}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className={activeTab !== 'publish' ? 'post-form-panel-hidden' : ''}>
          {/* Publish */}
          <div className="card">
            <div className="card-header"><h3 className="card-title">Xuất Bản</h3></div>
            <div className="card-body">
              <div className="form-group">
                <label>Danh Mục *</label>
                <select className="form-control" value={form.categoryId} required onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">Chọn danh mục</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="isPublished" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} />
                  <label htmlFor="isPublished" style={{ marginBottom: 0 }}>Công khai bài viết</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="isFeatured" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} />
                  <label htmlFor="isFeatured" style={{ marginBottom: 0 }}>Bài viết nổi bật</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="noIndex" checked={form.noIndex || false} onChange={e => setForm({ ...form, noIndex: e.target.checked })} />
                  <label htmlFor="noIndex" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🚫 Ẩn khỏi Google (noindex)
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 400 }}>— không index bài này</span>
                  </label>
                </div>
              </div>
            </div>
          </div>


          {/* Thumbnail / Ảnh Bìa */}
          <div className="card">
            <div className="card-header"><h3 className="card-title">🖼️ Ảnh Bìa Bài Viết</h3></div>
            <div className="card-body">
              {/* Preview */}
              {form.thumbnail ? (
                <div style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '12px', aspectRatio: '16/9', background: 'var(--bg-subtle)' }}>
                  <img
                    src={form.thumbnail}
                    alt="Ảnh bìa"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, thumbnail: '' })}
                    style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: 'rgba(239,68,68,0.9)', color: '#fff',
                      border: 'none', borderRadius: '6px', padding: '4px 8px',
                      cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                    }}
                  >
                    <X size={12} /> Xoá
                  </button>
                </div>
              ) : (
                <div style={{
                  aspectRatio: '16/9', border: '2px dashed var(--border)',
                  borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: 'var(--bg-subtle)', color: 'var(--text-muted)',
                  marginBottom: '12px', fontSize: '0.82rem',
                }}>
                  <Upload size={28} style={{ opacity: 0.4 }} />
                  <span>Chưa có ảnh bìa</span>
                </div>
              )}

              {/* Upload Button */}
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '9px', borderRadius: '8px', cursor: 'pointer',
                border: '1px dashed rgba(59,130,246,0.5)', background: 'rgba(59,130,246,0.05)',
                color: 'var(--primary-light)', fontWeight: 600, fontSize: '0.82rem',
                transition: '0.15s', marginBottom: '10px',
              }}>
                {uploadingThumb
                  ? <><Loader2 size={15} className="spinner" /> Đang tải lên...</>
                  : <><Upload size={15} /> Tải Ảnh Bìa Từ Máy Tính</>
                }
                <input
                  type="file" hidden accept="image/*,.webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingThumb(true);
                    try {
                      const fd = new FormData();
                      fd.append('image', file);
                      const res = await api.post('/upload', fd);
                      setForm(f => ({ ...f, thumbnail: res.data.data.url }));
                      toast.success('Đã tải ảnh bìa!');
                    } catch { toast.error('Lỗi khi tải ảnh'); }
                    finally { setUploadingThumb(false); }
                  }}
                  disabled={uploadingThumb}
                />
              </label>
              <button type="button" className="btn btn-outline btn-sm" style={{ width: '100%', marginBottom: 10 }} onClick={() => setMediaPickerOpen(true)}>
                Chọn ảnh từ thư viện
              </button>

              {/* Or URL */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Hoặc nhập URL ảnh:</div>
              <input
                type="text"
                className="form-control"
                placeholder="https://..."
                value={form.thumbnail || ''}
                onChange={e => setForm({ ...form, thumbnail: e.target.value })}
                style={{ fontSize: '0.82rem' }}
              />
            </div>
          </div>


          {/* Tags / Hashtags */}
          <div className="card">
            <div className="card-header"><h3 className="card-title"><Tag size={16} /> Thẻ / Hashtag</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: tags.length > 0 ? '10px' : '0' }}>
                {tags.map((tag, i) => (
                  <span key={i} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600,
                    background: 'var(--primary)', color: '#fff',
                  }}>
                    #{tag}
                    <button onClick={() => removeTag(i)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '0', lineHeight: 1 }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="text" className="form-control" value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                  placeholder="#excel #seo #tinhoc..."
                  style={{ flex: 1, fontSize: '0.82rem' }}
                />
                <button onClick={() => addTag(tagInput)} className="btn btn-outline btn-sm" disabled={!tagInput.trim()}>
                  <Hash size={14} />
                </button>
              </div>
              <small style={{ display: 'block', marginTop: '6px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                Nhấn Enter hoặc nút # để thêm thẻ
              </small>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="card">
            <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setTocOpen(!tocOpen)}>
              <h3 className="card-title"><List size={16} /> Mục Lục Tự Động ({toc.length})</h3>
              {tocOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            {tocOpen && (
              <div className="card-body">
                {toc.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {toc.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        paddingLeft: `${(item.level - 2) * 16}px`,
                        fontSize: '0.78rem', color: 'var(--text)',
                      }}>
                        <span style={{
                          width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                          background: item.level === 2 ? 'var(--primary)' : item.level === 3 ? '#10b981' : '#f59e0b',
                        }} />
                        <span>{item.text}</span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>H{item.level}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <List size={24} style={{ opacity: 0.2, marginBottom: '8px' }} />
                    <p style={{ margin: 0 }}>Sử dụng <code>## Heading</code> trong nội dung để tự động tạo mục lục</p>
                  </div>
                )}
                {toc.length > 0 && (
                  <div style={{ marginTop: '10px', padding: '8px', borderRadius: '6px', background: 'var(--bg-subtle)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    ✅ Mục lục sẽ tự động lưu kèm bài viết và hiển thị cho người đọc
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Source Info */}
          {aiSourceInfo && (
            <div className="card" style={{ borderLeft: '3px solid #10b981' }}>
              <div className="card-header"><h3 className="card-title" style={{ fontSize: '0.85rem' }}>🤖 Nguồn AI</h3></div>
              <div className="card-body" style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '99px', background: '#10b98115', color: '#10b981', fontWeight: 700, fontSize: '0.72rem' }}>
                      {aiSourceInfo.source || 'AI'}
                    </span>
                    {aiSourceInfo.elapsed && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>⏱️ {aiSourceInfo.elapsed}</span>}
                  </div>
                  {aiSourceInfo.sourceInfo?.writer && (
                    <div style={{ color: 'var(--text-secondary)' }}>
                      ✍️ Writer: <strong>{aiSourceInfo.sourceInfo.writer}</strong>
                    </div>
                  )}
                  {aiSourceInfo.sourceInfo?.research?.length > 0 && (
                    <div style={{ color: 'var(--text-secondary)' }}>
                      🔍 Research: {aiSourceInfo.sourceInfo.research.join(', ')}
                    </div>
                  )}
                  {aiSourceInfo.sourceInfo?.googleResultsCount > 0 && (
                    <div style={{ color: 'var(--text-secondary)' }}>
                      🌐 Google: {aiSourceInfo.sourceInfo.googleResultsCount} kết quả
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Canonical URL */}
          <div className="card">
            <div className="card-header"><h3 className="card-title" style={{ fontSize: '0.85rem' }}>🔗 Canonical URL</h3></div>
            <div className="card-body">
              <input
                type="text" className="form-control" value={form.canonicalUrl || ''}
                onChange={e => setForm({ ...form, canonicalUrl: e.target.value })}
                placeholder="Để trống = tự động dùng URL bài viết"
                style={{ fontSize: '0.82rem' }}
              />
              <small style={{ display: 'block', marginTop: '4px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                💡 Chỉ điền nếu bài này là bản sao từ URL khác. Để trống để Google tự động xác định.
              </small>
            </div>
          </div>

          {/* SEO Tips - Updated */}
          <div className="card" style={{ borderLeft: '3px solid #8b5cf6' }}>
            <div className="card-header"><h3 className="card-title"><Sparkles size={16} style={{ color: '#8b5cf6' }} /> Mẹo SEO Chuyên Nghiệp</h3></div>
            <div className="card-body" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  'Dùng AI tạo bài → Google Research + Groq/Gemini viết chuẩn E-E-A-T',
                  'Bài viết 1500+ từ, 5+ heading H2/H3, có FAQ để hiện Rich Snippet',
                  'Meta Title ≤ 60 ký tự, Meta Desc 120-160 ký tự, chứa từ khóa',
                  'Thêm ảnh bìa + ảnh trong bài với alt text để SEO hình ảnh',
                  'Schema JSON-LD + Sitemap tự động → Google index nhanh hơn',
                  'Xuất bản đều đặn 2-3 bài/tuần để tăng độ uy tín domain',
                ].map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px' }}>
                    <Lightbulb size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'ai' && (
          <div className="card" style={{ border: '1px solid rgba(139, 92, 246, 0.35)' }}>
            <div className="card-header">
              <h3 className="card-title"><Sparkles size={16} style={{ color: '#8b5cf6' }} /> Tạo bài bằng AI</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                AI nghiên cứu chủ đề, viết nội dung chuẩn SEO và điền sẵn meta. Chỉ dùng khi tạo bài mới.
              </p>
              {!id ? (
                <button type="button" className="btn btn-primary" onClick={() => setAiModalOpen(true)}>
                  <Sparkles size={16} /> Mở trình tạo bài AI
                </button>
              ) : (
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chỉnh sửa bài hiện có — dùng tab Nội dung / SEO.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <MediaPicker
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => setForm((f) => ({ ...f, thumbnail: url }))}
      />
    </div>
  );
}
