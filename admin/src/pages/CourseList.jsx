import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Search, BookOpen, X, Users as UsersIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { usePagedList } from '../hooks/usePagedList';
import { useConfirm } from '../components/ConfirmProvider';
import { clientPath } from '../lib/clientUrl';

export default function CourseList() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCourses = () => {
    setLoading(true);
    api.get('/courses/admin/all').then(res => {
      setCourses(res.data.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Xóa khóa học',
      message: 'Hành động không thể hoàn tác. Tiếp tục?',
      danger: true,
      confirmLabel: 'Xóa',
    });
    if (!ok) return;
    try {
      await api.delete(`/courses/${id}`);
      toast.success('Xóa thành công');
      fetchCourses();
    } catch { toast.error('Lỗi khi xóa'); }
  };

  const { items: pagedCourses, page, setPage, total, totalPages } = usePagedList(courses, {
    pageSize: 15,
    search,
    searchFn: (c, q) =>
      c.title?.toLowerCase().includes(q) ||
      c.category?.name?.toLowerCase().includes(q),
  });

  const getLevelBadge = (level) => {
    const map = {
      beginner: { cls: 'badge-success', text: 'Cơ Bản' },
      intermediate: { cls: 'badge-warning', text: 'Trung Cấp' },
      advanced: { cls: 'badge-danger', text: 'Nâng Cao' },
    };
    const l = map[level] || { cls: 'badge-secondary', text: level };
    return <span className={`badge ${l.cls}`}>{l.text}</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Quản lý khóa học</h1>
          <p>{total} khóa học trên hệ thống</p>
        </div>
        <Link to="/courses/new" className="btn btn-primary">
          <Plus size={18} /> Thêm Khóa Học
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input 
              type="text" className="form-control" placeholder="Tìm kiếm khóa học..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingRight: search ? '36px' : undefined }}
            />
            {search && (
              <button className="search-clear-btn" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Khóa Học</th>
                <th>Danh Mục</th>
                <th>Cấp Độ</th>
                <th>Giá (VNĐ)</th>
                <th>Học Viên</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7"><Loading /></td></tr>
              ) : pagedCourses.length === 0 ? (
                <tr><td colSpan="7"><EmptyState title="Không có khóa học" message="Thử đổi từ khóa hoặc thêm khóa mới." actionLabel="Thêm khóa học" onAction={() => navigate('/courses/new')} /></td></tr>
              ) : pagedCourses.map(course => (
                <tr key={course.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                        width: '44px', height: '32px', 
                        background: 'var(--bg-subtle)', 
                        borderRadius: '6px', 
                        overflow: 'hidden', 
                        flexShrink: 0,
                        border: '1px solid var(--border-light)',
                      }}>
                        {course.thumbnail && <img src={course.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <span style={{ fontWeight: 600 }}>{course.title}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-primary">{course.category?.name || '-'}</span></td>
                  <td>{getLevelBadge(course.level)}</td>
                  <td style={{ fontWeight: 600 }}>{new Intl.NumberFormat('vi-VN').format(course.price)}</td>
                  <td>
                    <span className="badge badge-secondary">
                      <UsersIcon size={11} /> {course._count?.enrollments || 0}
                    </span>
                  </td>
                  <td>
                    {course.isPublished 
                      ? <span className="status-pill pill-success">Công khai</span> 
                      : <span className="badge badge-secondary">Bản nháp</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Link to={`/courses/${course.id}/lessons`} className="btn btn-secondary btn-sm btn-icon" title="Bài học">
                        <BookOpen size={14} />
                      </Link>
                      <Link to={`/courses/edit/${course.id}`} className="btn btn-secondary btn-sm btn-icon" title="Sửa">
                        <Edit size={14} />
                      </Link>
                      <button onClick={() => handleDelete(course.id)} className="btn btn-secondary btn-sm btn-icon" title="Xóa" style={{ color: 'var(--danger)' }}>
                        <Trash2 size={14} />
                      </button>
                      <a href={clientPath(`/courses/${course.slug}`)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm btn-icon" title="Xem" aria-label="Xem trên web">
                        <Eye size={14} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
