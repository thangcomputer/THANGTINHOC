import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, GraduationCap, ArrowRight } from 'lucide-react';
import './PaymentSuccess.css';

export default function PaymentSuccess() {
  const { state } = useLocation();
  const courses = state?.courses || [];

  return (
    <div className="success-page">
      <div className="success-bg">
        <div className="success-orb" />
      </div>
      <div className="success-card">
        <div className="success-icon">
          <CheckCircle size={60} color="white" />
        </div>
        <h1>Thanh Toán Thành Công! 🎉</h1>
        <p>Bạn đã đăng ký thành công các khóa học sau:</p>

        {courses.length > 0 && (
          <div className="success-courses">
            {courses.map(c => (
              <div key={c.id} className="success-course-item">
                <GraduationCap size={18} color="#10b981" />
                <span>{c.title}</span>
              </div>
            ))}
          </div>
        )}

        <p className="success-note">
          Khóa học đã được kích hoạt trong tài khoản của bạn. Hãy bắt đầu học ngay!
        </p>

        <div className="success-actions">
          <Link to="/my-courses" className="btn btn-primary btn-lg">
            <GraduationCap size={18} /> Khóa Học Của Tôi
          </Link>
          <Link to="/courses" className="btn btn-ghost btn-lg">
            Xem Thêm Khóa Học <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
