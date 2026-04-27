import { Link } from 'react-router-dom';
import { Star, Users, Clock, BookOpen } from 'lucide-react';
import './CourseCard.css';

const levelMap = {
  beginner: { label: 'Cơ Bản', class: 'badge-success' },
  intermediate: { label: 'Trung Cấp', class: 'badge-warning' },
  advanced: { label: 'Nâng Cao', class: 'badge-danger' },
};

function formatPrice(price) {
  return price === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function calcDiscount(original, price) {
  if (!original || original <= price) return null;
  return Math.round((1 - price / original) * 100);
}

export default function CourseCard({ course }) {
  const level = levelMap[course.level] || levelMap.beginner;
  const discount = calcDiscount(course.originalPrice, course.price);

  return (
    <Link to={`/courses/${course.slug}`} className="course-card">
      <div className="course-thumbnail">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} />
        ) : (
          <div className="course-thumbnail-placeholder">
            <BookOpen size={48} />
          </div>
        )}
        <div className="course-level">
          <span className={`badge ${level.class}`}>{level.label}</span>
        </div>
        {discount && <div className="course-discount">-{discount}%</div>}
      </div>

      <div className="course-body">
        <p className="course-category">{course.category?.name}</p>
        <h3 className="course-title">{course.title}</h3>
        <p className="course-desc">{course.description}</p>

        <div className="course-meta">
          <span><Clock size={13} /> {course.duration || 'N/A'}</span>
          <span><BookOpen size={13} /> {course.totalLessons} bài</span>
          <span><Users size={13} /> {course.totalStudents || 0}</span>
        </div>

        <div className="course-rating">
          <div className="stars">
            {[1,2,3,4,5].map(i => {
              const active = i <= Math.round(course.avgRating || 0);
              return <Star key={i} size={13} fill={active ? '#f59e0b' : 'none'} color={active ? '#f59e0b' : 'currentColor'} />;
            })}
          </div>
          <span>{course.avgRating || '0.0'}</span>
          <span className="rating-count">({course.reviewCount || 0} đánh giá)</span>
        </div>

        <div className="course-footer">
          <div className="course-price-wrap">
            <span className="price">{formatPrice(course.price)}</span>
            {course.originalPrice && course.originalPrice > course.price && (
              <span className="price-original">{formatPrice(course.originalPrice)}</span>
            )}
          </div>
          <span className="btn btn-primary btn-sm">Xem Ngay</span>
        </div>
      </div>
    </Link>
  );
}
