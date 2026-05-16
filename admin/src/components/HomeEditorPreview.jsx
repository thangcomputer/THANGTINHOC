import { useMemo, useState } from 'react';
import { RefreshCcw, ExternalLink } from 'lucide-react';
import { SECTION_PREVIEW_HASH } from '../lib/homeEditorSections';

export default function HomeEditorPreview({ activeTab, refreshKey = 0 }) {
  const [localTick, setLocalTick] = useState(0);
  const hash = SECTION_PREVIEW_HASH[activeTab] || '';
  const tick = refreshKey + localTick;
  const src = useMemo(() => {
    const base = typeof window !== 'undefined' ? `${window.location.origin}/` : '/';
    const q = tick ? `?preview=${tick}` : '';
    return `${base}${q}${hash}`;
  }, [hash, tick]);

  return (
    <aside className="home-editor-preview" aria-label="Xem trước trang chủ">
      <div className="home-editor-preview-bar">
        <span>Xem trước (sau khi lưu)</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="btn btn-icon btn-sm"
            onClick={() => setLocalTick((t) => t + 1)}
            title="Tải lại"
          >
            <RefreshCcw size={14} />
          </button>
          <button
            type="button"
            className="btn btn-icon btn-sm"
            onClick={() => window.open(src, '_blank')}
            title="Mở tab mới"
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
      <iframe key={src} title="Xem trước trang chủ" src={src} className="home-editor-preview-frame" />
    </aside>
  );
};
