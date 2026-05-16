import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Edit, Trash2, ArrowLeft, Save, Play, BookOpen, X, Loader2, Upload, File, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Loading from '../components/Loading';
import { useConfirm } from '../components/ConfirmProvider';

export default function LessonManager() {
  const confirm = useConfirm();
  const { id: courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingLesson, setEditingLesson] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', content: '', videoUrl: '', duration: 0, order: 0, isPreview: false
  });

  // Materials
  const [matModalOpen, setMatModalOpen] = useState(false);
  const [matLesson, setMatLesson] = useState(null);
  const [matList, setMatList] = useState([]);
  const [matUploading, setMatUploading] = useState(false);
  const [matTitle, setMatTitle] = useState('');

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/courses/admin/${courseId}`);
      setCourse(res.data.data);
      setLessons(res.data.data.lessons || []);
    } catch { toast.error('Lỗi khi tải dữ liệu'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCourseData(); }, [courseId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingLesson) {
        await api.put(`/courses/${courseId}/lessons/${editingLesson.id}`, form);
        toast.success('Cập nhật bài học thành công');
      } else {
        await api.post(`/courses/${courseId}/lessons`, form);
        toast.success('Thêm bài học thành công');
      }
      setIsModalOpen(false);
      setEditingLesson(null);
      fetchCourseData();
    } catch { toast.error('Lỗi khi lưu bài học'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (lessonId) => {
    const ok = await confirm({
      title: 'Xóa bài học',
      message: 'Bài học sẽ bị xóa vĩnh viễn. Tiếp tục?',
      danger: true,
      confirmLabel: 'Xóa',
    });
    if (!ok) return;
    try {
      await api.delete(`/courses/${courseId}/lessons/${lessonId}`);
      toast.success('Đã xóa bài học');
      fetchCourseData();
    } catch { toast.error('Lỗi khi xóa bài học'); }
  };

  const openForm = (lesson = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setForm({ ...lesson });
    } else {
      setEditingLesson(null);
      setForm({ title: '', content: '', videoUrl: '', duration: 0, order: lessons.length + 1, isPreview: false });
    }
    setIsModalOpen(true);
  };

  const openMatModal = async (lesson) => {
    setMatLesson(lesson);
    setMatModalOpen(true);
    setMatTitle('');
    try {
      const res = await api.get(`/lessons/${lesson.id}/materials`);
      setMatList(res.data.data || []);
    } catch { setMatList([]); }
  };

  const handleMatUpload = async (file) => {
    if (!file || !matLesson) return;
    setMatUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', matTitle || file.name);
      await api.post(`/lessons/${matLesson.id}/materials`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Tải lên tài liệu thành công');
      setMatTitle('');
      const res = await api.get(`/lessons/${matLesson.id}/materials`);
      setMatList(res.data.data || []);
    } catch { toast.error('Lỗi tải lên'); }
    finally { setMatUploading(false); }
  };

  const handleMatDelete = async (matId) => {
    try {
      await api.delete(`/materials/${matId}`);
      setMatList(matList.filter(m => m.id !== matId));
      toast.success('Đã xóa');
    } catch { toast.error('Lỗi xóa'); }
  };

  if (loading) return <Loading fullPage message="Đang tải bài học..." />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <Link to="/courses" className="btn btn-secondary btn-sm" style={{ marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Quay Lại
          </Link>
          <h1>Bài Học: {course?.title}</h1>
          <p>{lessons.length} bài học trong khóa học</p>
        </div>
        <button className="btn btn-primary" onClick={() => openForm()}>
          <Plus size={18} /> Thêm Bài Mới
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>STT</th>
                <th>Tên Bài Học</th>
                <th>Video</th>
                <th>Thời Lượng</th>
                <th>Xem Trước</th>
                <th>Tài Liệu</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {lessons.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Chưa có bài học nào</td></tr>
              ) : lessons.map(lesson => (
                <tr key={lesson.id}>
                  <td>
                    <span style={{ 
                      width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-subtle)', display: 'inline-flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)',
                    }}>{lesson.order}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={15} color="var(--text-muted)" />
                      <span style={{ fontWeight: 600 }}>{lesson.title}</span>
                    </div>
                  </td>
                  <td>
                    {lesson.videoUrl ? (
                      <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500, fontSize: '0.8rem' }}>
                        <Play size={13} /> Có video
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>{lesson.duration ? `${lesson.duration} phút` : '—'}</td>
                  <td>{lesson.isPreview ? <span className="badge badge-success">Có</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openMatModal(lesson)} style={{ fontSize: '0.75rem' }}>
                      <Upload size={12} /> Tài liệu
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openForm(lesson)} title="Sửa">
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-secondary btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(lesson.id)} title="Xóa">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lesson Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h2>{editingLesson ? 'Sửa Bài Học' : 'Thêm Bài Học Mới'}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>Tiêu Đề Bài Học *</label>
                <input type="text" className="form-control" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Link Video (YouTube/Vimeo)</label>
                <input type="text" className="form-control" placeholder="https://youtube.com/watch?v=..." value={form.videoUrl || ''} onChange={e => setForm({...form, videoUrl: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Thời Lượng (Phút)</label>
                  <input type="number" className="form-control" value={form.duration} onChange={e => setForm({...form, duration: parseInt(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label>Thứ Tự</label>
                  <input type="number" className="form-control" value={form.order} onChange={e => setForm({...form, order: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div className="form-group">
                <label>Nội dung bài học</label>
                <textarea 
                  className="form-control" rows="8" 
                  value={form.content || ''} 
                  onChange={e => setForm({...form, content: e.target.value})}
                  placeholder="Nhập nội dung bài học..."
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
                <input type="checkbox" id="isPreview" checked={form.isPreview} onChange={e => setForm({...form, isPreview: e.target.checked})} />
                <label htmlFor="isPreview" style={{ marginBottom: 0 }}>Cho phép xem trước (khách chưa mua)</label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><Loader2 size={16} className="spinner" /> Đang lưu...</> : <><Save size={16} /> Lưu Bài Học</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Materials Modal */}
      {matModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h2>📁 Tài liệu: {matLesson?.title}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setMatModalOpen(false)}><X size={18} /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {/* Upload */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                <input type="text" className="form-control" placeholder="Tên tài liệu" value={matTitle}
                  onChange={e => setMatTitle(e.target.value)} style={{ flex: 1 }} />
                <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Upload size={14} /> {matUploading ? 'Đang tải...' : 'Tải lên'}
                  <input type="file" hidden disabled={matUploading} onChange={e => {
                    if (e.target.files?.[0]) handleMatUpload(e.target.files[0]);
                    e.target.value = '';
                  }} />
                </label>
              </div>
              {/* List */}
              {matList.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Chưa có tài liệu nào</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {matList.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                      <File size={16} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {m.fileType?.toUpperCase()} • {m.fileSize ? `${(m.fileSize/1024).toFixed(0)} KB` : ''}
                        </div>
                      </div>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => handleMatDelete(m.id)} title="Xóa" style={{ color: 'var(--danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
