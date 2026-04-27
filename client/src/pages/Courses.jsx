import { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import api from '../lib/api';
import CourseCard from '../components/CourseCard';
import './Courses.css';

const levels = [
  { value: '', label: 'Tất cả cấp độ' },
  { value: 'beginner', label: 'Cơ Bản' },
  { value: 'intermediate', label: 'Trung Cấp' },
  { value: 'advanced', label: 'Nâng Cao' },
];

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchCourses = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 9 });
    if (search) params.append('search', search);
    if (level) params.append('level', level);
    if (categoryId) params.append('categoryId', categoryId);

    api.get(`/courses?${params}`).then(res => {
      setCourses(res.data.data || []);
      setPagination(res.data.pagination || {});
    }).catch(() => setCourses([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/stats/categories?type=course').then(res => setCategories(res.data.data || []));
  }, []);

  useEffect(() => { fetchCourses(); }, [page, level, categoryId]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCourses();
  };

  return (
    <div className="courses-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-bg" />
        <div className="container page-header-content">
          <div className="section-tag"><Filter size={14} /> Khóa Học</div>
          <h1 className="page-title">Tất Cả <span className="highlight">Khóa Học</span></h1>
          <p className="page-subtitle">Chọn khóa học phù hợp và bắt đầu hành trình học tập ngay hôm nay</p>
        </div>
      </div>

      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        {/* Filters */}
        <div className="courses-filters">
          <form onSubmit={handleSearch} className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm khóa học..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary btn-sm">Tìm</button>
          </form>

          <div className="filter-chips">
            <SlidersHorizontal size={16} />
            <select className="filter-select" value={level} onChange={e => { setLevel(e.target.value); setPage(1); }}>
              {levels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <select className="filter-select" value={categoryId} onChange={e => { setCategoryId(e.target.value); setPage(1); }}>
              <option value="">Tất cả danh mục</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="results-count">
            Tìm thấy <strong>{pagination.total || 0}</strong> khóa học
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="loader"><div className="spinner" /></div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <Search size={48} />
            <p>Không tìm thấy khóa học nào</p>
          </div>
        ) : (
          <div className="grid-3">{courses.map(c => <CourseCard key={c.id} course={c} />)}</div>
        )}

        {/* Pagination */}
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
