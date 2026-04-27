import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Eye, ArrowLeft, Tag, List, ChevronRight, BookOpen } from 'lucide-react';
import api from '../lib/api';
import { sanitizeHTML } from '../lib/sanitize';
import './BlogDetail.css';

function timeAgo(date) {
  if (!date) return '';
  const d = new Date(date);
  const diffDays = Math.floor((Date.now() - d) / 86400000);
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}

// Parse Table of Contents from JSON or generate from HTML headings
function parseTOC(post) {
  // Try stored TOC first
  try {
    const stored = JSON.parse(post.tableOfContents || '[]');
    if (Array.isArray(stored) && stored.length > 0) return stored;
  } catch {}

  // Generate from content HTML
  const toc = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(post.content || '', 'text/html');
  doc.querySelectorAll('h2, h3, h4').forEach((el) => {
    const level = parseInt(el.tagName[1]);
    const text = el.textContent.trim();
    const id = text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    toc.push({ id, text, level });
  });
  return toc;
}

// Add IDs to headings in HTML content + wrap images with figure/figcaption
function processContent(html) {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Add IDs to headings
  doc.querySelectorAll('h2, h3, h4').forEach((el) => {
    const text = el.textContent.trim();
    const id = text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    el.id = id;
  });

  // Wrap standalone images with figure + figcaption
  doc.querySelectorAll('img').forEach((img) => {
    if (img.closest('figure')) return; // already wrapped
    const alt = img.getAttribute('alt') || '';
    const figure = doc.createElement('figure');
    figure.className = 'bd-figure';
    img.parentNode.insertBefore(figure, img);
    figure.appendChild(img);
    if (alt && alt !== img.getAttribute('src')) {
      const caption = doc.createElement('figcaption');
      caption.textContent = alt;
      figure.appendChild(caption);
    }
  });

  return sanitizeHTML(doc.body.innerHTML);
}

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState('');
  const [tocOpen, setTocOpen] = useState(true);
  const contentRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setPost(null);
    setRelated([]);
    api.get(`/posts/${slug}`)
      .then(res => {
        const p = res.data.data;
        setPost(p);

        // ── SEO: Dynamic Meta Tags ──
        document.title = (p.metaTitle || p.title) + ' | Thắng Tin Học';
        const setMeta = (name, content) => {
          if (!content) return;
          let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
          if (!el) { el = document.createElement('meta'); el.setAttribute(name.startsWith('og:') || name.startsWith('article:') ? 'property' : 'name', name); document.head.appendChild(el); }
          el.content = content;
        };
        setMeta('description', p.metaDescription || p.excerpt || '');
        setMeta('keywords', (() => { try { return JSON.parse(p.tags || '[]').join(', '); } catch { return ''; } })());
        setMeta('og:title', p.metaTitle || p.title);
        setMeta('og:description', p.metaDescription || p.excerpt || '');
        setMeta('og:type', 'article');
        setMeta('og:url', window.location.href);
        if (p.thumbnail) setMeta('og:image', p.thumbnail);
        setMeta('article:published_time', p.createdAt);
        setMeta('article:modified_time', p.updatedAt);
        setMeta('article:section', p.category?.name || '');

        // ── SEO: Schema.org JSON-LD (Article + FAQ + Breadcrumb) ──
        api.get(`/seo/post/${slug}`).then(seoRes => {
          const schemas = seoRes.data?.data?.schemas || [];
          // Remove old schema scripts
          document.querySelectorAll('script[data-seo-schema]').forEach(el => el.remove());
          // Inject new schemas
          schemas.forEach((schema, i) => {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-seo-schema', `schema-${i}`);
            script.textContent = JSON.stringify(schema);
            document.head.appendChild(script);
          });
        }).catch(() => {});

        // Fetch related posts by same category
        if (p?.category?.id) {
          api.get(`/posts?categoryId=${p.category.id}&limit=6`)
            .then(r => {
              const others = (r.data.data || []).filter(x => x.slug !== slug).slice(0, 6);
              setRelated(others);
            }).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);

    // Cleanup: restore default title + remove schemas on unmount
    return () => {
      document.title = 'Thắng Tin Học - Trung Tâm Đào Tạo Tin Học';
      document.querySelectorAll('script[data-seo-schema]').forEach(el => el.remove());
    };
  }, [slug]);

  // Highlight active TOC item on scroll
  useEffect(() => {
    if (!post) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-10% 0px -75% 0px' }
    );
    const headings = contentRef.current?.querySelectorAll('h2, h3, h4') || [];
    headings.forEach(h => observer.observe(h));
    return () => observer.disconnect();
  }, [post]);

  if (loading) return <div className="loader" style={{ height: '100vh' }}><div className="spinner" /></div>;
  if (!post) return <div style={{ padding: '10rem', textAlign: 'center' }}>Không tìm thấy bài viết</div>;

  const toc = parseTOC(post);
  const processedContent = processContent(post.content);

  return (
    <div className="blog-detail">
      {/* ── HERO ── */}
      <div className="bd-hero">
        <div className="bd-hero-bg" />
        <div className="container bd-hero-content">
          <Link to="/blog" className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem' }}>
            <ArrowLeft size={16} /> Quay Lại Blog
          </Link>
          <span className="badge badge-primary"><Tag size={12} /> {post.category?.name}</span>
          <h1 className="bd-title">{post.title}</h1>
          <div className="bd-meta">
            <div className="bd-author">
              <div className="author-avatar-sm">{post.author?.fullName?.[0] || 'A'}</div>
              <span>{post.author?.fullName}</span>
            </div>
            <span><Clock size={14} />{timeAgo(post.createdAt)}</span>
            <span><Eye size={14} />{post.views} lượt xem</span>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="bd-layout container">

        {/* ── LEFT: TOC Sidebar ── */}
        {toc.length > 0 && (
          <aside className="bd-toc-sidebar">
            <div className="bd-toc-box">
              <button className="bd-toc-toggle" onClick={() => setTocOpen(v => !v)}>
                <List size={16} />
                <span>Mục Lục</span>
                <ChevronRight size={14} style={{ transform: tocOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
              </button>
              {tocOpen && (
                <nav className="bd-toc-nav">
                  {toc.map((item, i) => (
                    <a
                      key={i}
                      href={`#${item.id}`}
                      className={`bd-toc-item bd-toc-h${item.level}${activeId === item.id ? ' active' : ''}`}
                      onClick={e => {
                        e.preventDefault();
                        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              )}
            </div>
          </aside>
        )}

        {/* ── RIGHT: Content ── */}
        <main className="bd-main">
          {post.thumbnail && (
            <div className="bd-featured-img">
              <img src={post.thumbnail} alt={post.title} />
            </div>
          )}

          {/* Inline TOC for mobile */}
          {toc.length > 0 && (
            <div className="bd-toc-inline">
              <div className="bd-toc-inline-header"><List size={15} /> Mục Lục Bài Viết</div>
              <ol className="bd-toc-inline-list">
                {toc.filter(t => t.level === 2).map((item, i) => (
                  <li key={i}>
                    <a href={`#${item.id}`} onClick={e => {
                      e.preventDefault();
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}>{item.text}</a>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Post content */}
          <div
            className="bd-content"
            ref={contentRef}
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />

          {/* Tags */}
          {post.tags && (() => {
            try {
              const tags = JSON.parse(post.tags);
              if (Array.isArray(tags) && tags.length > 0) return (
                <div className="bd-tags">
                  {tags.map((t, i) => (
                    <Link key={i} to={`/blog?tag=${t}`} className="bd-tag">#{t}</Link>
                  ))}
                </div>
              );
            } catch {}
            return null;
          })()}

          {/* ── RELATED POSTS ── */}
          {related.length > 0 && (
            <section className="bd-related">
              <h2 className="bd-related-title">
                <BookOpen size={20} /> Bài Viết Liên Quan
              </h2>
              <div className="bd-related-grid">
                {related.map(r => (
                  <Link key={r.id} to={`/blog/${r.slug}`} className="bd-related-card">
                    <div className="bd-related-thumb">
                      {r.thumbnail
                        ? <img src={r.thumbnail} alt={r.title} />
                        : <div className="bd-related-thumb-placeholder"><BookOpen size={28} /></div>
                      }
                      {r.category && <span className="bd-related-cat">{r.category.name}</span>}
                    </div>
                    <div className="bd-related-info">
                      <h3>{r.title}</h3>
                      <p>{r.excerpt}</p>
                      <span className="bd-related-date"><Clock size={11} /> {timeAgo(r.createdAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="bd-cta">
            <p>Muốn học thêm? Khám phá <Link to="/courses" className="text-link">các khóa học của chúng tôi →</Link></p>
          </div>
        </main>
      </div>
    </div>
  );
}
