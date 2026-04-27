import { useState, useEffect } from 'react';
import { GraduationCap, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import './MyCourses.css';

export default function MyCourses() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    api.get('/courses/my/enrolled').then(res => setEnrollments(res.data.data || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="my-courses-page">
      <div className="page-header">
        <div className="page-header-bg" />
        <div className="container page-header-content">
          <div className="section-tag"><GraduationCap size={14} /> Học Tập</div>
          <h1 className="page-title">Khóa Học <span className="highlight">Của Tôi</span></h1>
          <p className="page-subtitle">Tất cả khóa học bạn đã đăng ký</p>
        </div>
      </div>

      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        {loading ? (
          <div className="loader"><div className="spinner" /></div>
        ) : enrollments.length === 0 ? (
          <div className="empty-enrolled">
            <GraduationCap size={64} />
            <h3>Bạn chưa có khóa học nào</h3>
            <p>Hãy khám phá và đăng ký các khóa học phù hợp với bạn</p>
            <Link to="/courses" className="btn btn-primary btn-lg">Khám Phá Khóa Học</Link>
          </div>
        ) : (
          <div className="enrolled-grid">
            {enrollments.map(enrollment => {
              const course = enrollment.course;
              const completed = enrollment.progress?.filter(p => p.completed).length || 0;
              const total = course._count?.lessons || 0;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <Link key={enrollment.id} to={`/learn/${course.slug}`} className="enrolled-card">
                  <div className="enrolled-img">
                    {course.thumbnail ? <img src={course.thumbnail} alt="" /> : <div className="enrolled-placeholder"><BookOpen size={40} /></div>}
                  </div>
                  <div className="enrolled-body">
                    <span className="badge badge-primary">{course.category?.name}</span>
                    <h3 className="enrolled-title">{course.title}</h3>
                    <div className="enrolled-meta">
                      <span><Clock size={13} /> {course.duration}</span>
                      <span><BookOpen size={13} /> {total} bài</span>
                    </div>
                    <div className="progress-wrap">
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="progress-text">{pct}% hoàn thành</span>
                    </div>
                    <div className="enrolled-footer">
                      <span className="btn btn-primary btn-sm">Tiếp Tục Học <ChevronRight size={14} /></span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
