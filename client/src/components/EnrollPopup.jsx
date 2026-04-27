import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import './EnrollPopup.css';

export default function EnrollPopup({ isOpen, onClose }) {
  const [tab, setTab] = useState('course');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  // Reset toàn bộ form về trống
  const resetForms = () => {
    setCourseForm({ fullName: '', phone: '', courses: [], level: '', schedule: '', note: '' });
    setExamForm({ fullName: '', phone: '', birthDate: '', idNumber: '', examType: [] });
    setExamSubs({});
    setTab('course');
    setSuccess(false);
  };

  const handleClose = () => { onClose(); resetForms(); };

  // Lock body scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Course form
  const [courseForm, setCourseForm] = useState({
    fullName: '', phone: '',
    courses: [], level: '', schedule: '', note: ''
  });

  // Exam form
  const [examForm, setExamForm] = useState({
    fullName: '', phone: '', birthDate: '', idNumber: '',
    examType: []
  });

  const courseOptions = [
    { id: 'Tin học văn phòng cơ bản', icon: '💻' },
    { id: 'Tin học văn phòng nâng cao', icon: '📊' },
    { id: 'Luyện thi chứng chỉ MOS/IC3', icon: '🏆' },
    { id: 'AI ứng dụng', icon: '🤖' },
  ];

  const toggleCourse = (c) => {
    setCourseForm(prev => ({
      ...prev,
      courses: prev.courses.includes(c) ? prev.courses.filter(x => x !== c) : [...prev.courses, c]
    }));
  };

  const examOptions = [
    { id: 'tin-hoc-co-ban', label: 'Tin học văn phòng (cơ bản)', icon: '💻', sub: [] },
    { id: 'ic3', label: 'Chứng chỉ IC3 (Digital Literacy)', icon: '🌐', sub: [{ key: 'lang', label: 'Ngôn ngữ thi', options: ['Tiếng Việt', 'Tiếng Anh'] }] },
    { id: 'mos-word', label: 'MOS Word', icon: '📝', sub: [{ key: 'lang', label: 'Ngôn ngữ', options: ['Tiếng Việt', 'Tiếng Anh'] }, { key: 'ver', label: 'Phiên bản', options: ['Office 2019', 'Microsoft 365'] }] },
    { id: 'mos-excel', label: 'MOS Excel', icon: '📊', sub: [{ key: 'lang', label: 'Ngôn ngữ', options: ['Tiếng Việt', 'Tiếng Anh'] }, { key: 'ver', label: 'Phiên bản', options: ['Office 2019', 'Microsoft 365'] }] },
    { id: 'mos-ppt', label: 'MOS PowerPoint', icon: '📽️', sub: [{ key: 'lang', label: 'Ngôn ngữ', options: ['Tiếng Việt', 'Tiếng Anh'] }, { key: 'ver', label: 'Phiên bản', options: ['Office 2019', 'Microsoft 365'] }] },
  ];

  // Per-exam sub selections: { ic3: { lang: 'Tiếng Việt' }, 'mos-word': { lang: 'Tiếng Anh', ver: 'Office 2019' }}
  const [examSubs, setExamSubs] = useState({});

  const toggleExam = (id) => {
    setExamForm(prev => ({
      ...prev,
      examType: prev.examType.includes(id) ? prev.examType.filter(x => x !== id) : [...prev.examType, id]
    }));
  };

  const setExamSub = (examId, key, value) => {
    setExamSubs(prev => ({
      ...prev,
      [examId]: { ...(prev[examId] || {}), [key]: value }
    }));
  };

  const handleSubmit = async () => {
    if (tab === 'course') {
      if (!courseForm.fullName.trim()) return toast.error('Vui lòng nhập họ và tên');
      if (!courseForm.phone.trim()) return toast.error('Vui lòng nhập số điện thoại');
      if (courseForm.phone.length < 9) return toast.error('Số điện thoại không hợp lệ');
      if (courseForm.courses.length === 0) return toast.error('Vui lòng chọn ít nhất 1 khóa học');
      if (!courseForm.level) return toast.error('Vui lòng chọn mức độ hiện tại');
      if (!courseForm.schedule) return toast.error('Vui lòng chọn khung giờ học');
      setSending(true);
      try {
        await api.post('/registrations', {
          type: 'course', fullName: courseForm.fullName, phone: courseForm.phone,
          courses: JSON.stringify(courseForm.courses), level: courseForm.level,
          schedule: courseForm.schedule, note: courseForm.note,
        });
        setSuccess(true);
      } catch { toast.error('Lỗi gửi đăng ký, vui lòng thử lại'); }
      finally { setSending(false); }
    } else {
      if (!examForm.fullName.trim()) return toast.error('Vui lòng nhập họ và tên');
      if (!examForm.phone.trim()) return toast.error('Vui lòng nhập số điện thoại');
      if (examForm.phone.length < 9) return toast.error('Số điện thoại không hợp lệ');
      if (!examForm.birthDate) return toast.error('Vui lòng chọn ngày tháng năm sinh');
      if (!examForm.idNumber.trim()) return toast.error('Vui lòng nhập số CCCD');
      if (examForm.examType.length === 0) return toast.error('Vui lòng chọn ít nhất 1 chứng chỉ thi');
      setSending(true);
      try {
        // Send per-exam data with their language/version selections
        const examData = examForm.examType.map(id => ({
          id,
          ...(examSubs[id] || {})
        }));
        await api.post('/registrations', {
          type: 'exam', fullName: examForm.fullName, phone: examForm.phone,
          birthDate: examForm.birthDate, idNumber: examForm.idNumber,
          examType: JSON.stringify(examData),
        });
        setSuccess(true);
      } catch { toast.error('Lỗi gửi đăng ký, vui lòng thử lại'); }
      finally { setSending(false); }
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="enroll-overlay" onClick={handleClose}>
      <div className="enroll-wrapper" onClick={e => e.stopPropagation()}>
        {/* Close button — nửa trên cạnh form */}
        <button className="enroll-close" onClick={handleClose} aria-label="Đóng">
          <X size={18} />
        </button>

        <div className="enroll-popup">

        {success ? (
          <div className="enroll-success">
            <CheckCircle size={56} />
            <h3>Đăng Ký Thành Công!</h3>
            <p>Chúng tôi sẽ liên hệ bạn trong thời gian sớm nhất.</p>
            <button className="enroll-btn" onClick={handleClose}>Đóng</button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="enroll-tabs">
              <button className={`enroll-tab ${tab === 'course' ? 'active' : ''}`} onClick={() => setTab('course')}>
                ĐĂNG KÝ HỌC
              </button>
              <button className={`enroll-tab ${tab === 'exam' ? 'active' : ''}`} onClick={() => setTab('exam')}>
                ĐĂNG KÝ THI
              </button>
            </div>

            <div className="enroll-body">
              {tab === 'course' ? (
                <>
                  <div className="enroll-grid-2">
                    <div className="enroll-field">
                      <label>Họ và tên <span>*</span></label>
                      <input type="text" placeholder="Nguyễn Văn A" value={courseForm.fullName}
                        onChange={e => setCourseForm({ ...courseForm, fullName: e.target.value })} />
                    </div>
                    <div className="enroll-field">
                      <label>Số điện thoại <span>*</span></label>
                      <input type="tel" inputMode="numeric" pattern="[0-9]*" placeholder="0909..." value={courseForm.phone}
                        onChange={e => setCourseForm({ ...courseForm, phone: e.target.value.replace(/[^0-9]/g, '') })} />
                    </div>
                  </div>
                  <div className="enroll-field">
                    <label>Chọn khóa học: <span>*</span></label>
                    <div className="enroll-checks">
                      {courseOptions.map(c => (
                        <label key={c.id} className={`enroll-check ${courseForm.courses.includes(c.id) ? 'checked' : ''}`}>
                          <span className="custom-checkbox">
                            {courseForm.courses.includes(c.id) && <svg viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" /></svg>}
                          </span>
                          <span className="check-icon">{c.icon}</span>
                          <span className="check-label">{c.id}</span>
                          <input type="checkbox" checked={courseForm.courses.includes(c.id)} onChange={() => toggleCourse(c.id)} hidden />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="enroll-grid-2">
                    <div className="enroll-field">
                      <label>Mức độ hiện tại <span>*</span></label>
                      <select value={courseForm.level} onChange={e => setCourseForm({ ...courseForm, level: e.target.value })}>
                        <option value="">-- Chọn --</option>
                        <option value="beginner">Mới bắt đầu</option>
                        <option value="intermediate">Đã biết cơ bản</option>
                        <option value="advanced">Nâng cao</option>
                      </select>
                    </div>
                    <div className="enroll-field">
                      <label>Khung giờ học mong muốn <span>*</span></label>
                      <select value={courseForm.schedule} onChange={e => setCourseForm({ ...courseForm, schedule: e.target.value })}>
                        <option value="">-- Chọn --</option>
                        <option value="sang">Sáng (8h-12h)</option>
                        <option value="chieu">Chiều (13h-17h)</option>
                        <option value="toi">Tối (18h-21h)</option>
                        <option value="flexible">Linh hoạt</option>
                      </select>
                    </div>
                  </div>
                  <div className="enroll-field">
                    <label>Ghi chú thêm</label>
                    <textarea rows="2" placeholder="VD: Cần học gấp, rảnh thứ 7 CN..." value={courseForm.note}
                      onChange={e => setCourseForm({ ...courseForm, note: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <div className="enroll-grid-2">
                    <div className="enroll-field">
                      <label>Họ và tên <span>*</span></label>
                      <input type="text" placeholder="Nguyễn Văn A" value={examForm.fullName}
                        onChange={e => setExamForm({ ...examForm, fullName: e.target.value })} />
                    </div>
                    <div className="enroll-field">
                      <label>Số điện thoại <span>*</span></label>
                      <input type="tel" inputMode="numeric" pattern="[0-9]*" placeholder="0909..." value={examForm.phone}
                        onChange={e => setExamForm({ ...examForm, phone: e.target.value.replace(/[^0-9]/g, '') })} />
                    </div>
                  </div>
                  <div className="enroll-grid-2">
                    <div className="enroll-field">
                      <label>Ngày tháng năm sinh <span>*</span></label>
                      <input type="date" value={examForm.birthDate}
                        onChange={e => setExamForm({ ...examForm, birthDate: e.target.value })} />
                    </div>
                    <div className="enroll-field">
                      <label>Căn cước công dân <span>*</span></label>
                      <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0123456789" value={examForm.idNumber}
                        onChange={e => setExamForm({ ...examForm, idNumber: e.target.value.replace(/[^0-9]/g, '') })} />
                    </div>
                  </div>
                  <div className="enroll-field">
                    <label>Chọn chứng chỉ thi: <span>*</span></label>
                    <div className="exam-options">
                      {examOptions.map(opt => {
                        const isSelected = examForm.examType.includes(opt.id);
                        const subs = examSubs[opt.id] || {};
                        return (
                          <div key={opt.id} className={`exam-option ${isSelected ? 'selected' : ''}`}>
                            {/* Header row: checkbox + title */}
                            <label className="exam-header" onClick={() => toggleExam(opt.id)}>
                              <span className="custom-checkbox">
                                {isSelected && <svg viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" /></svg>}
                              </span>
                              <span className="exam-icon">{opt.icon}</span>
                              <span className="exam-label-text">{opt.label}</span>
                            </label>

                            {/* Sub-options (only show when selected) */}
                            {isSelected && opt.sub.length > 0 && (
                              <div className="exam-option-subs">
                                {opt.sub.map(s => (
                                  <div key={s.key} className="exam-sub">
                                    <span className="exam-sub-label">{s.label}:</span>
                                    <div className="exam-sub-radios">
                                      {s.options.map(o => (
                                        <label key={o} className={`exam-radio ${subs[s.key] === o ? 'active' : ''}`}>
                                          <input type="radio" name={`${opt.id}_${s.key}`} value={o}
                                            checked={subs[s.key] === o}
                                            onChange={() => setExamSub(opt.id, s.key, o)} />
                                          <span>{o}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <button className="enroll-btn" onClick={handleSubmit} disabled={sending}>
                {sending ? <><Loader2 size={18} className="spin" /> Đang gửi...</> :
                  <><Send size={18} /> {tab === 'course' ? 'ĐĂNG KÝ HỌC NGAY' : 'ĐĂNG KÝ THI NGAY'}</>}
              </button>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  , document.body);
}
