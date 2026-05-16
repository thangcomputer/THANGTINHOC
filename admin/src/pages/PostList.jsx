import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { usePagedList } from '../hooks/usePagedList';
import { useConfirm } from '../components/ConfirmProvider';
import { clientPath } from '../lib/clientUrl';

export default function PostList() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPosts = () => {
    setLoading(true);
    api.get('/posts/admin/all').then(res => {
      setPosts(res.data.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Xóa bài viết',
      message: 'Hành động không thể hoàn tác. Tiếp tục?',
      danger: true,
      confirmLabel: 'Xóa',
    });
    if (!ok) return;
    try {
      await api.delete(`/posts/${id}`);
      toast.success('Xóa thành công');
      fetchPosts();
    } catch {
      toast.error('Lỗi khi xóa');
    }
  };

  const { items: pagedPosts, page, setPage, total, totalPages } = usePagedList(posts, {
    pageSize: 15,
    search,
    searchFn: (p, q) =>
      p.title?.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q),
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Quản lý bài viết</h1>
          <p>{total} bài viết trên hệ thống</p>
        </div>
        <Link to="/posts/new" className="btn btn-primary">
          <Plus size={18} /> Viết Bài Mới
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text" className="form-control" placeholder="Tìm kiếm bài viết..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingRight: search ? '36px' : undefined }}
            />
            {search && (
              <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bài Viết</th>
                <th>Danh Mục</th>
                <th>Lượt Xem</th>
                <th>Trạng Thái</th>
                <th>Ngày Đăng</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6"><Loading /></td></tr>
              ) : pagedPosts.length === 0 ? (
                <tr><td colSpan="6"><EmptyState title="Không có bài viết" message="Thử đổi từ khóa hoặc viết bài mới." actionLabel="Viết bài mới" onAction={() => navigate('/posts/new')} /></td></tr>
              ) : pagedPosts.map(post => (
                <tr key={post.id}>
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
                        {post.thumbnail && <img src={post.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <span style={{ fontWeight: 600 }}>{post.title}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-primary">{post.category?.name || '-'}</span></td>
                  <td style={{ fontWeight: 500 }}>{post.views?.toLocaleString() || 0}</td>
                  <td>
                    {post.isPublished
                      ? <span className="status-pill pill-success">Công khai</span>
                      : <span className="badge badge-secondary">Bản nháp</span>}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Link to={`/posts/edit/${post.id}`} className="btn btn-secondary btn-sm btn-icon" title="Sửa">
                        <Edit size={14} />
                      </Link>
                      <button type="button" onClick={() => handleDelete(post.id)} className="btn btn-secondary btn-sm btn-icon" title="Xóa" style={{ color: 'var(--danger)' }}>
                        <Trash2 size={14} />
                      </button>
                      <a href={clientPath(`/blog/${post.slug}`)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm btn-icon" title="Xem">
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
