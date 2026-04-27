import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, Tag } from 'lucide-react';
import api from '../lib/api';
import './Blog.css';

function timeAgo(date) {
  const d = new Date(date);
  const diffDays = Math.floor((Date.now() - d) / 86400000);
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    api.get('/stats/categories?type=post').then(res => setCategories(res.data.data || []));
    api.get('/posts?featured=true&limit=3').then(res => setFeatured(res.data.data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 9 });
    if (categoryId) params.append('categoryId', categoryId);
    api.get(`/posts?${params}`).then(res => {
      setPosts(res.data.data || []);
      setPagination(res.data.pagination || {});
    }).finally(() => setLoading(false));
  }, [page, categoryId]);

  return (
    <div className="blog-page">
      <div className="page-header">
        <div className="page-header-bg" />
        <div className="container page-header-content">
          <div className="section-tag"><Tag size={14} /> Blog</div>
          <h1 className="page-title">Kiến Thức <span className="highlight">Tin Học</span></h1>
          <p className="page-subtitle">Chia sẻ thủ thuật, hướng dẫn và tin tức mới nhất về tin học văn phòng</p>
        </div>
      </div>

      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        {/* Featured posts */}
        {featured.length > 0 && (
          <div className="featured-posts">
            <Link to={`/blog/${featured[0].slug}`} className="featured-main">
              <div className="feat-img-wrap">
                {featured[0].thumbnail ? (
                  <img src={featured[0].thumbnail} alt={featured[0].title} />
                ) : <div className="feat-placeholder" />}
              </div>
              <div className="feat-overlay">
                <span className="badge badge-primary">{featured[0].category?.name}</span>
                <h2>{featured[0].title}</h2>
                <p>{featured[0].excerpt}</p>
                <div className="feat-meta">
                  <Clock size={13} />{timeAgo(featured[0].createdAt)}
                  <Eye size={13} />{featured[0].views} lượt xem
                </div>
              </div>
            </Link>
            <div className="featured-side">
              {featured.slice(1).map(post => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="feat-side-post">
                  <div className="feat-side-img">
                    {post.thumbnail ? <img src={post.thumbnail} alt="" /> : <div className="feat-placeholder" />}
                  </div>
                  <div className="feat-side-info">
                    <span className="badge badge-primary" style={{fontSize:'0.7rem'}}>{post.category?.name}</span>
                    <h4>{post.title}</h4>
                    <p className="feat-side-meta"><Clock size={12} />{timeAgo(post.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="blog-filters">
          <button className={`filter-tag ${!categoryId ? 'active' : ''}`} onClick={() => setCategoryId('')}>Tất cả</button>
          {categories.map(c => (
            <button key={c.id} className={`filter-tag ${categoryId == c.id ? 'active' : ''}`} onClick={() => setCategoryId(c.id)}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="loader"><div className="spinner" /></div>
        ) : (
          <div className="grid-3">
            {posts.map(post => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="post-card">
                <div className="post-img">
                  {post.thumbnail ? <img src={post.thumbnail} alt="" /> : <div className="post-placeholder" />}
                </div>
                <div className="post-body">
                  <span className="badge badge-primary">{post.category?.name}</span>
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-excerpt">{post.excerpt}</p>
                  <div className="post-footer">
                    <span><Clock size={13} />{timeAgo(post.createdAt)}</span>
                    <span><Eye size={13} />{post.views}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
