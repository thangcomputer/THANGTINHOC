import { useEffect, useState } from 'react';
import { X, Search, ImageIcon, Loader2 } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function MediaPicker({ open, onClose, onSelect }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get('/media')
      .then((res) => setMedia(res.data.data || []))
      .catch(() => toast.error('Không tải duoc thu vien anh'))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const filtered = search.trim()
    ? media.filter((m) =>
        (m.filename || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.alt || '').toLowerCase().includes(search.toLowerCase())
      )
    : media;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-content media-picker-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', width: '95%' }}>
        <div className="modal-header">
          <h2><ImageIcon size={18} /> Chọn ảnh tu thu vien</h2>
          <button type="button" className="btn btn-secondary btn-icon btn-sm" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '0 20px 12px' }}>
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Tìm ảnh..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-form" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 className="spinner" size={28} /></div>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Chưa có ảnh. Tai len o Quan ly anh.</p>
          ) : (
            <div className="media-picker-grid">
              {filtered.map((m) => (
                <button
                  key={m.filename}
                  type="button"
                  className="media-picker-item"
                  onClick={() => { onSelect(m.url); onClose(); toast.success('Đã chọn anh'); }}
                >
                  <img src={m.url} alt={m.alt || m.filename} loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}