import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <div>
        <p style={{ fontSize: '8rem', fontWeight: 900, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>404</p>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>Trang Không Tìm Thấy</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary"><Home size={18} /> Trang Chủ</Link>
          <button className="btn btn-ghost" onClick={() => history.back()}><ArrowLeft size={18} /> Quay Lại</button>
        </div>
      </div>
    </div>
  );
}
