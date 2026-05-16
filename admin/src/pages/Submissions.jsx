import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, Eye, X, Download, MessageSquare, Star, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { downloadProtectedFile } from '../lib/download';
import Loading from '../components/Loading';

export default function Submissions() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(null); // submission being graded
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, graded

  const STORAGE_KEY = 'admin_submissions_course_id';

  useEffect(() => {
    api.get('/courses?limit=100').then(res => {
      const list = res.data.data || [];
      setCourses(list);
      if (list.length > 0) {
        const saved = localStorage.getItem(STORAGE_KEY);
        const match = saved && list.find((c) => String(c.id) === saved);
        setSelectedCourse(match ? saved : String(list[0].id));
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCourse) localStorage.setItem(STORAGE_KEY, String(selectedCourse));
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedCourse) fetchSubmissions();
  }, [selectedCourse]);

  const fetchSubmissions = async () => {
    try {
      const res = await api.get(`/courses/${selectedCourse}/submissions`);
      setSubmissions(res.data.data || []);
    } catch {
      setSubmissions([]);
      toast.error('Không tải được danh sách bài nộp');
    }
  };

  const handleGrade = async () => {
    if (!grading) return;
    setSaving(true);
    try {
      await api.put(`/submissions/${grading.id}`, {
        score: gradeForm.score ? parseFloat(gradeForm.score) : null,
        feedback: gradeForm.feedback,
        grade: 'graded',
      });
      toast.success('Đã chấm điểm thành công!');
      setGrading(null);
      fetchSubmissions();
    } catch { toast.error('Lỗi khi chấm điểm'); }
    finally { setSaving(false); }
  };

  const filtered = submissions.filter(s => {
    if (filter === 'pending') return s.grade !== 'graded';
    if (filter === 'graded') return s.grade === 'graded';
    return true;
  });

  if (loading) return <Loading fullPage message="Đang tải..." />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>📝 Bài Tập Học Viên</h1>
          <p>Xem và chấm điểm bài tập nộp từ học viên</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="form-control" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
          style={{ width: '300px' }}>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[['all', 'Tất cả'], ['pending', 'Chờ chấm'], ['graded', 'Đã chấm']].map(([val, label]) => (
            <button key={val} className={`btn btn-sm ${filter === val ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(val)}>{label}</button>
          ))}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 'auto' }}>
          {filtered.length} bài nộp
        </span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Học Viên</th>
                <th>Bài Học</th>
                <th>File Nộp</th>
                <th>Ghi Chú</th>
                <th>Ngày Nộp</th>
                <th>Trạng Thái</th>
                <th>Điểm</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Chưa có bài tập nào
                  </td>
                </tr>
              ) : filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'var(--gradient-primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700,
                      }}>
                        {s.user?.fullName?.[0] || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.user?.fullName}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem' }}>{s.lesson?.title || `Bài ${s.lessonId}`}</span>
                  </td>
                  <td>
                    <button type="button"
                      onClick={() => downloadProtectedFile(`/submissions/${s.id}/download`, s.fileName)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Download size={13} /> {s.fileName?.substring(0, 20)}{s.fileName?.length > 20 ? '...' : ''}
                    </button>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.note || '—'}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(s.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </td>
                  <td>
                    {s.grade === 'graded' ? (
                      <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={12} /> Đã chấm
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> Chờ chấm
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: s.score ? 'var(--success)' : 'var(--text-muted)' }}>
                      {s.score ?? '—'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      setGrading(s);
                      setGradeForm({ score: s.score || '', feedback: s.feedback || '' });
                    }}>
                      <Star size={13} /> Chấm
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grading Modal */}
      {grading && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>⭐ Chấm Điểm Bài Tập</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setGrading(null)}><X size={18} /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem', padding: '12px', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>👤 {grading.user?.fullName}</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  📄 {grading.fileName} • {grading.lesson?.title || `Bài ${grading.lessonId}`}
                </p>
                {grading.note && <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>📝 {grading.note}</p>}
                <button type="button"
                  className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}
                  onClick={() => downloadProtectedFile(`/submissions/${grading.id}/download`, grading.fileName)}>
                  <Download size={13} /> Tải xuống bài nộp
                </button>
              </div>

              <div className="form-group">
                <label>Điểm (0-10)</label>
                <input type="number" className="form-control" placeholder="VD: 8.5" step="0.5" min="0" max="10"
                  value={gradeForm.score} onChange={e => setGradeForm({ ...gradeForm, score: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Nhận xét cho học viên</label>
                <textarea className="form-control" rows="4" placeholder="Nhận xét về bài làm..."
                  value={gradeForm.feedback} onChange={e => setGradeForm({ ...gradeForm, feedback: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setGrading(null)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleGrade} disabled={saving}>
                  {saving ? <><Loader2 size={16} className="spinner" /> Đang lưu...</> : <><CheckCircle size={16} /> Lưu Điểm</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
