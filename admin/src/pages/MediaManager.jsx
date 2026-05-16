import { useEffect, useState, useMemo } from 'react';
import api from '../lib/api';
import { uploadAdminFile } from '../lib/uploadFile';
import { toast } from 'react-hot-toast';
import { Upload, Trash2, Copy, CheckSquare, Square, List, Grid, RefreshCw, Save } from 'lucide-react';
import './MediaManager.css';

export default function MediaManager() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [saving, setSaving] = useState({}); // { filename: true } khi đang lưu
  const perPage = 12;

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await api.get('/media');
      setMedia(res.data.data || []);
    } catch {
      toast.error('Lấy danh sách ảnh thất bại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMedia(); }, []);

  const { filtered, totalPages, paginated } = useMemo(() => {
    const filtered = search.trim()
      ? media.filter(m =>
          (m.alt || '').toLowerCase().includes(search.toLowerCase()) ||
          (m.title || '').toLowerCase().includes(search.toLowerCase()) ||
          (m.filename || '').toLowerCase().includes(search.toLowerCase())
        )
      : media;
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage);
    return { filtered, totalPages, paginated };
  }, [media, search, page]);

  // Xóa 1 ảnh
  const handleDelete = async (filename, e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    try {
      await api.delete(`/media/${encodeURIComponent(filename)}`);
      toast.success('Xóa ảnh thành công');
      setMedia(prev => prev.filter(m => m.filename !== filename));
      setSelected(prev => prev.filter(f => f !== filename));
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Xóa ảnh thất bại');
    }
  };

  // Sao chép URL
  const handleCopy = (url, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(url);
    toast.success('Đã sao chép liên kết');
  };

  // Cập nhật alt/title trong local state
  const updateMeta = (filename, field, value) => {
    setMedia(prev => prev.map(m => m.filename === filename ? { ...m, [field]: value } : m));
  };

  // Lưu alt/title lên server
  const saveMeta = async (filename) => {
    const item = media.find(m => m.filename === filename);
    if (!item) return;
    setSaving(prev => ({ ...prev, [filename]: true }));
    try {
      await api.put(`/media/${encodeURIComponent(filename)}`, {
        alt: item.alt || '',
        title: item.title || '',
      });
      toast.success('Đã lưu thông tin ảnh');
    } catch (err) {
      console.error('Save meta error:', err);
      toast.error('Lỗi khi lưu thông tin');
    } finally {
      setSaving(prev => ({ ...prev, [filename]: false }));
    }
  };

  const toggleSelect = (filename) => {
    setSelected(prev =>
      prev.includes(filename) ? prev.filter(f => f !== filename) : [...prev, filename]
    );
  };

  const allCurrentSelected = paginated.length > 0 && paginated.every(m => selected.includes(m.filename));

  const toggleSelectAll = () => {
    const ids = paginated.map(m => m.filename);
    if (allCurrentSelected) {
      setSelected(prev => prev.filter(f => !ids.includes(f)));
    } else {
      setSelected(prev => Array.from(new Set([...prev, ...ids])));
    }
  };

  // Xóa hàng loạt
  const bulkDelete = async () => {
    if (!selected.length) return toast.error('Chưa chọn ảnh nào');
    try {
      await Promise.all(selected.map(fn => api.delete(`/media/${encodeURIComponent(fn)}`)));
      toast.success(`Đã xóa ${selected.length} ảnh`);
      setMedia(prev => prev.filter(m => !selected.includes(m.filename)));
      setSelected([]);
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    toast.loading('Đang tải ảnh lên...', { id: 'upload' });
    let count = 0;
    for (const file of files) {
      try {
        await uploadAdminFile(file);
        count++;
      } catch {
        toast.error(`Lỗi: ${file.name}`);
      }
    }
    toast.dismiss('upload');
    if (count > 0) {
      toast.success(`Đã tải lên ${count} ảnh`);
      fetchMedia();
    }
    e.target.value = '';
  };

  return (
    <div className="mm-wrapper">
      {/* Header */}
      <div className="mm-header">
        <div>
          <h1 className="mm-title">Thư Viện Media</h1>
          <p className="mm-subtitle">{media.length} tệp – Tự động chuyển đổi sang WebP</p>
        </div>
        <div className="mm-header-actions">
          <button type="button" onClick={fetchMedia} className="mm-btn mm-btn-ghost" title="Làm mới">
            <RefreshCw size={16} />
          </button>
          <label className="mm-btn mm-btn-primary">
            <Upload size={16} />
            Thêm ảnh mới
            <input type="file" hidden accept="image/*,.webp" multiple onChange={handleUpload} />
          </label>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mm-toolbar">
        <div className="mm-toolbar-left">
          <input
            type="checkbox"
            checked={allCurrentSelected}
            onChange={toggleSelectAll}
            className="mm-checkbox"
            title="Chọn tất cả trên trang"
          />
          {selected.length > 0 && (
            <span className="mm-selected-count">{selected.length} đã chọn</span>
          )}
          {selected.length > 0 && (
            <button type="button" onClick={bulkDelete} className="mm-btn mm-btn-danger-sm">
              <Trash2 size={14} /> Xóa đã chọn
            </button>
          )}
        </div>
        <div className="mm-toolbar-right">
          <input
            type="text"
            placeholder="Tìm kiếm ảnh..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="mm-search"
          />
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`mm-btn mm-btn-ghost ${viewMode === 'grid' ? 'mm-btn-active' : ''}`}
            title="Lưới"
          >
            <Grid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`mm-btn mm-btn-ghost ${viewMode === 'list' ? 'mm-btn-active' : ''}`}
            title="Danh sách"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="mm-loading">
          <RefreshCw size={32} className="mm-spin" />
          <p>Đang tải...</p>
        </div>
      ) : media.length === 0 ? (
        <label className="mm-empty">
          <Upload size={56} className="mm-empty-icon" />
          <p className="mm-empty-title">Chưa có ảnh nào</p>
          <p className="mm-empty-sub">Kéo thả hoặc nhấn để tải ảnh lên</p>
          <span className="mm-btn mm-btn-primary" style={{ marginTop: '16px' }}>
            <Upload size={16} /> Tải ảnh lên
          </span>
          <input type="file" hidden accept="image/*,.webp" multiple onChange={handleUpload} />
        </label>
      ) : (
        <>
          <div className={viewMode === 'grid' ? 'mm-grid' : 'mm-list'}>
            {paginated.map(item => (
              <div
                key={item.filename}
                className={`mm-card ${selected.includes(item.filename) ? 'mm-card-selected' : ''}`}
              >
                {/* Checkbox overlay */}
                <button
                  type="button"
                  className="mm-card-check"
                  onClick={() => toggleSelect(item.filename)}
                >
                  {selected.includes(item.filename)
                    ? <CheckSquare size={18} />
                    : <Square size={18} />}
                </button>

                {/* Image */}
                <div className="mm-card-img-wrap">
                  <img src={item.url} alt={item.alt || item.filename} loading="lazy" />
                  {/* Hover overlay actions */}
                  <div className="mm-card-overlay">
                    <button
                      type="button"
                      onClick={(e) => handleCopy(item.url, e)}
                      title="Sao chép URL"
                    >
                      <Copy size={16} />
                      <span>Copy URL</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.filename, e)}
                      title="Xóa"
                      className="mm-overlay-danger"
                    >
                      <Trash2 size={16} />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>

                {/* Meta */}
                <div className="mm-card-meta">
                  <p className="mm-card-filename" title={item.filename}>
                    {item.filename.length > 28 ? item.filename.slice(0, 25) + '...' : item.filename}
                  </p>
                  <input
                    type="text"
                    placeholder="Alt text..."
                    value={item.alt || ''}
                    onChange={e => updateMeta(item.filename, 'alt', e.target.value)}
                    className="mm-meta-input"
                  />
                  <input
                    type="text"
                    placeholder="Tiêu đề..."
                    value={item.title || ''}
                    onChange={e => updateMeta(item.filename, 'title', e.target.value)}
                    className="mm-meta-input"
                  />
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="mm-btn mm-btn-save"
                      onClick={() => saveMeta(item.filename)}
                      disabled={saving[item.filename]}
                      title="Lưu alt & tiêu đề"
                    >
                      <Save size={12} />
                      {saving[item.filename] ? 'Đang lưu...' : 'Lưu'}
                    </button>
                    <button
                      type="button"
                      className="mm-btn mm-btn-danger-sm"
                      onClick={(e) => handleDelete(item.filename, e)}
                      title="Xóa ảnh"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mm-pagination">
              <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="mm-btn mm-btn-ghost">
                ← Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`mm-btn ${page === p ? 'mm-btn-primary' : 'mm-btn-ghost'}`}
                >
                  {p}
                </button>
              ))}
              <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="mm-btn mm-btn-ghost">
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
