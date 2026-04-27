import { useState, useRef, useEffect } from 'react';
import { Search, X, BookOpen, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import './SearchBox.css';

export default function SearchBox() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ courses: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setOpen(true); }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleSearch = (val) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults({ courses: [], posts: [] }); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [coursesRes, postsRes] = await Promise.all([
          api.get('/courses', { params: { search: val, limit: 5 } }).catch(() => ({ data: { data: [] } })),
          api.get('/posts', { params: { search: val, limit: 5 } }).catch(() => ({ data: { data: [] } })),
        ]);
        setResults({
          courses: (coursesRes.data?.data || []).slice(0, 4),
          posts: (postsRes.data?.data || []).slice(0, 4),
        });
      } catch { }
      finally { setLoading(false); }
    }, 350);
  };

  const goTo = (path) => {
    setOpen(false); setQuery(''); setResults({ courses: [], posts: [] });
    navigate(path);
  };

  const hasResults = results.courses.length > 0 || results.posts.length > 0;

  return (
    <>
      <button className="search-trigger" onClick={() => setOpen(true)} title="Tìm kiếm (Ctrl+K)">
        <Search size={18} />
      </button>

      {open && (
        <div className="search-overlay" onClick={() => setOpen(false)}>
          <div className="search-modal" onClick={e => e.stopPropagation()}>
            <div className="search-header">
              <Search size={18} className="search-icon" />
              <input ref={inputRef} type="text" placeholder="Tìm khóa học, bài viết..."
                value={query} onChange={e => handleSearch(e.target.value)} className="search-input" />
              {loading && <Loader2 size={16} className="spin search-loading" />}
              <button className="search-close" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {query.trim() && (
              <div className="search-results">
                {hasResults ? (
                  <>
                    {results.courses.length > 0 && (
                      <div className="search-section">
                        <div className="search-section-label"><BookOpen size={12} /> Khóa Học</div>
                        {results.courses.map(c => (
                          <button key={c.id} className="search-item" onClick={() => goTo(`/courses/${c.slug}`)}>
                            {c.thumbnail && <img src={c.thumbnail.startsWith('http') ? c.thumbnail : `http://localhost:5000${c.thumbnail}`} alt="" className="search-thumb" />}
                            <div className="search-item-info">
                              <span className="search-item-title">{c.title}</span>
                              <span className="search-item-meta">{c.level} • {Number(c.price).toLocaleString('vi-VN')}đ</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {results.posts.length > 0 && (
                      <div className="search-section">
                        <div className="search-section-label"><FileText size={12} /> Bài Viết</div>
                        {results.posts.map(p => (
                          <button key={p.id} className="search-item" onClick={() => goTo(`/blog/${p.slug}`)}>
                            <div className="search-item-info">
                              <span className="search-item-title">{p.title}</span>
                              <span className="search-item-meta">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="search-empty">Không tìm thấy kết quả cho "{query}"</div>
                )}
              </div>
            )}

            {!query.trim() && (
              <div className="search-hint">
                <kbd>Ctrl</kbd> + <kbd>K</kbd> để mở tìm kiếm nhanh
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
