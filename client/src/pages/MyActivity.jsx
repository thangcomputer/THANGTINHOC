import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, BookOpen, CheckCircle, Clock, Star, MessageSquare,
  FileText, Award, ChevronRight, AlertCircle, RefreshCw, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import './MyActivity.css';

function formatPrice(p) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const STATUS_MAP = {
  paid:      { label: 'Đã thanh toán', color: 'success' },
  pending:   { label: 'Chờ thanh toán', color: 'warning' },
  cancelled: { label: 'Đã hủy',        color: 'danger'  },
  refunded:  { label: 'Hoàn tiền',     color: 'muted'   },
};

const TABS = [
  { id: 'orders',      label: 'Đơn Hàng',    icon: ShoppingBag },
  { id: 'courses',     label: 'Khóa Học',    icon: BookOpen    },
  { id: 'submissions', label: 'Bài Tập',     icon: FileText    },
  { id: 'comments',    label: 'Bình Luận',   icon: MessageSquare },
];

export default function MyActivity() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ordRes, enrRes, subRes, comRes] = await Promise.allSettled([
        api.get('/orders/my'),
        api.get('/courses/my/enrolled'),
        api.get('/submissions/my'),
        api.get('/comments/my'),
      ]);
      if (ordRes.status === 'fulfilled') setOrders(ordRes.value.data.data || []);
      if (enrRes.status === 'fulfilled') setEnrollments(enrRes.value.data.data || []);
      if (subRes.status === 'fulfilled') setSubmissions(subRes.value.data.data || []);
      if (comRes.status === 'fulfilled') setComments(comRes.value.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const completedCourses = enrollments.filter(e => {
    const total = e.course?._count?.lessons || 0;
    const done = e.progress?.filter(p => p.completed).length || 0;
    return total > 0 && done >= total;
  }).length;

  const avgScore = submissions.filter(s => s.score !== null).length > 0
    ? (submissions.filter(s => s.score !== null).reduce((a, s) => a + s.score, 0) / submissions.filter(s => s.score !== null).length).toFixed(1)
    : null;

  return (
    <div className="my-activity-page">
      {/* Hero */}
      <div className="ma-hero">
        <div className="ma-hero-bg" />
        <div className="container ma-hero-content">
          <div className="ma-hero-avatar">
            {user?.avatar
              ? <img src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_URL?.replace('/api','')}${user.avatar}`} alt="" />
              : <div className="ma-avatar-placeholder">{user?.fullName?.[0] || 'U'}</div>
            }
          </div>
          <div>
            <h1>Xin chào, <span className="ma-highlight">{user?.fullName}</span>!</h1>
            <p className="ma-hero-sub">Theo dõi toàn bộ hoạt động học tập của bạn</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="container">
        <div className="ma-stats-grid">
          <div className="ma-stat-card">
            <ShoppingBag size={28} className="ma-stat-icon icon-blue" />
            <div>
              <p className="ma-stat-num">{orders.length}</p>
              <p className="ma-stat-label">Đơn hàng</p>
            </div>
          </div>
          <div className="ma-stat-card">
            <BookOpen size={28} className="ma-stat-icon icon-purple" />
            <div>
              <p className="ma-stat-num">{enrollments.length}</p>
              <p className="ma-stat-label">Khóa học đã đăng ký</p>
            </div>
          </div>
          <div className="ma-stat-card">
            <CheckCircle size={28} className="ma-stat-icon icon-green" />
            <div>
              <p className="ma-stat-num">{completedCourses}</p>
              <p className="ma-stat-label">Khóa học hoàn thành</p>
            </div>
          </div>
          <div className="ma-stat-card">
            <Award size={28} className="ma-stat-icon icon-gold" />
            <div>
              <p className="ma-stat-num">{avgScore !== null ? avgScore : '—'}</p>
              <p className="ma-stat-label">Điểm TB bài tập</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="ma-tabs">
          {TABS.map(t => (
            <button
              key={t.id} type="button"
              className={`ma-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={16} /> {t.label}
              {t.id === 'orders' && orders.length > 0 && <span className="ma-badge">{orders.length}</span>}
              {t.id === 'submissions' && submissions.filter(s => s.grade === 'graded').length > 0 &&
                <span className="ma-badge ma-badge-green">{submissions.filter(s => s.grade === 'graded').length}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="ma-content">
          {loading ? (
            <div className="ma-loading"><RefreshCw size={32} className="ma-spin" /><p>Đang tải...</p></div>
          ) : (
            <>
              {/* ── ORDERS ── */}
              {tab === 'orders' && (
                <div className="ma-section">
                  {orders.length === 0 ? (
                    <div className="ma-empty">
                      <ShoppingBag size={56} />
                      <h3>Bạn chưa có đơn hàng nào</h3>
                      <Link to="/courses" className="btn btn-primary">Khám Phá Khóa Học</Link>
                    </div>
                  ) : orders.map(order => {
                    const st = STATUS_MAP[order.status] || { label: order.status, color: 'muted' };
                    return (
                      <div key={order.id} className="ma-order-card">
                        <div className="ma-order-header">
                          <div>
                            <span className="ma-order-code">#{order.orderCode}</span>
                            <span className={`ma-status-pill pill-${st.color}`}>{st.label}</span>
                          </div>
                          <div className="ma-order-meta">
                            <Clock size={13} /> {formatDate(order.createdAt)}
                          </div>
                        </div>
                        <div className="ma-order-items">
                          {order.orderItems?.map(item => (
                            <div key={item.id} className="ma-order-item">
                              {item.course?.thumbnail
                                ? <img src={item.course.thumbnail} alt="" className="ma-course-thumb" />
                                : <div className="ma-course-thumb-ph"><BookOpen size={20} /></div>
                              }
                              <div className="ma-order-item-info">
                                <p className="ma-order-item-title">{item.course?.title}</p>
                                <p className="ma-order-item-price">{formatPrice(item.price)}</p>
                              </div>
                              {order.status === 'paid' && (
                                <Link to={`/learn/${item.course?.slug}`} className="btn btn-primary btn-sm ma-learn-btn">
                                  Vào Học <ChevronRight size={14} />
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="ma-order-footer">
                          <span>Phương thức: <strong>{order.paymentMethod === 'mock' ? 'Demo' : order.paymentMethod?.toUpperCase()}</strong></span>
                          <span className="ma-order-total">Tổng: <strong>{formatPrice(order.totalAmount)}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── COURSES ── */}
              {tab === 'courses' && (
                <div className="ma-section">
                  {enrollments.length === 0 ? (
                    <div className="ma-empty">
                      <BookOpen size={56} />
                      <h3>Bạn chưa đăng ký khóa học nào</h3>
                      <Link to="/courses" className="btn btn-primary">Khám Phá Khóa Học</Link>
                    </div>
                  ) : (
                    <div className="ma-course-grid">
                      {enrollments.map(enrollment => {
                        const course = enrollment.course;
                        const total = course._count?.lessons || 0;
                        const done = enrollment.progress?.filter(p => p.completed).length || 0;
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                        const completed = total > 0 && done >= total;
                        return (
                          <div key={enrollment.id} className={`ma-course-card ${completed ? 'ma-course-complete' : ''}`}>
                            {completed && <div className="ma-complete-ribbon"><Award size={12} /> Hoàn thành</div>}
                            <div className="ma-course-thumb-wrap">
                              {course.thumbnail
                                ? <img src={course.thumbnail} alt={course.title} />
                                : <div className="ma-course-thumb-ph large"><BookOpen size={36} /></div>
                              }
                            </div>
                            <div className="ma-course-body">
                              <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{course.category?.name}</span>
                              <h4 className="ma-course-title">{course.title}</h4>
                              <div className="ma-progress-block">
                                <div className="ma-progress-bar-track">
                                  <div className="ma-progress-bar-fill" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="ma-progress-text">{done}/{total} bài · {pct}%</span>
                              </div>
                              <Link to={`/learn/${course.slug}`} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}>
                                {pct === 0 ? 'Bắt Đầu Học' : pct === 100 ? 'Xem Lại' : 'Tiếp Tục Học'}
                                <ChevronRight size={14} />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── SUBMISSIONS ── */}
              {tab === 'submissions' && (
                <div className="ma-section">
                  {submissions.length === 0 ? (
                    <div className="ma-empty">
                      <FileText size={56} />
                      <h3>Bạn chưa nộp bài tập nào</h3>
                      <p>Hoàn thành các bài học và nộp bài tập để nhận điểm từ giáo viên</p>
                    </div>
                  ) : submissions.map(sub => (
                    <div key={sub.id} className="ma-submission-card">
                      <div className="ma-sub-left">
                        <FileText size={22} className={sub.grade === 'graded' ? 'icon-green' : 'icon-muted'} />
                        <div>
                          <p className="ma-sub-lesson">{sub.lesson?.title || 'Bài tập'}</p>
                          <p className="ma-sub-course">{sub.lesson?.course?.title}</p>
                          <p className="ma-sub-date"><Clock size={12} /> {formatDate(sub.createdAt)}</p>
                        </div>
                      </div>
                      <div className="ma-sub-right">
                        {sub.grade === 'graded' ? (
                          <div className="ma-score-block">
                            <div className={`ma-score ${sub.score >= 8 ? 'score-high' : sub.score >= 5 ? 'score-mid' : 'score-low'}`}>
                              {sub.score !== null ? sub.score : '✓'}
                            </div>
                            <span className="ma-graded-label">Đã chấm</span>
                            {sub.feedback && (
                              <div className="ma-feedback">
                                <MessageSquare size={12} /> <em>{sub.feedback}</em>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="ma-pending-block">
                            <Clock size={16} className="icon-muted" />
                            <span className="ma-pending-label">Chờ chấm</span>
                          </div>
                        )}
                        {sub.fileUrl && (
                          <a href={`${import.meta.env.VITE_API_URL?.replace('/api','')}${sub.fileUrl}`}
                            target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
                            Xem File
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── COMMENTS ── */}
              {tab === 'comments' && (
                <div className="ma-section">
                  {comments.length === 0 ? (
                    <div className="ma-empty">
                      <MessageSquare size={56} />
                      <h3>Bạn chưa có bình luận nào</h3>
                      <p>Tham gia thảo luận trong các khóa học để nhận hỗ trợ từ giáo viên</p>
                    </div>
                  ) : comments.map(c => (
                    <div key={c.id} className="ma-comment-card">
                      <div className="ma-comment-meta">
                        <div className="ma-comment-location">
                          {c.lesson?.course?.title && (
                            <Link
                              to={`/learn/${c.lesson?.course?.slug}`}
                              className="ma-comment-course-name"
                            >
                              <BookOpen size={13} /> {c.lesson.course.title}
                            </Link>
                          )}
                          {c.lesson?.course?.title && c.lesson?.title && (
                            <span className="ma-comment-sep">›</span>
                          )}
                          {c.lesson?.title && (
                            <span className="ma-comment-lesson-name">{c.lesson.title}</span>
                          )}
                        </div>
                        <span className="ma-comment-date"><Clock size={12} /> {formatDate(c.createdAt)}</span>
                      </div>
                      <p className="ma-comment-body">{c.content}</p>
                      {c.replies?.length > 0 && (
                        <div className="ma-comment-replies">
                          {c.replies.map(r => (
                            <div key={r.id} className="ma-reply">
                              <span className={`ma-reply-author ${r.user?.role === 'admin' ? 'admin-reply' : ''}`}>
                                {r.user?.role === 'admin' ? '👨‍🏫 Giáo viên' : r.user?.fullName}
                              </span>
                              <p>{r.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
