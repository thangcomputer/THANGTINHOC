import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, CheckCircle, Play, 
  BookOpen, Menu, X, ArrowLeft, MessageSquare, Star,
  Trophy, StickyNote, Save, Clock, Download, Upload,
  FileText, File, Trash2, Loader2, Camera, ImagePlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { sanitizeHTML } from '../lib/sanitize';
import useAuthStore from '../store/authStore';
import './CoursePlayer.css';

/* ── circular progress ring ── */
function ProgressRing({ percent, size = 100, stroke = 6 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="progress-ring">
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="url(#progressGrad)" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      <defs>
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function CoursePlayer() {
  const { slug, lessonId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [course, setCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Tabs
  const [activeTab, setActiveTab] = useState('overview');
  const [qaFilter, setQaFilter] = useState('current');
  const [viewingQuestion, setViewingQuestion] = useState(null);
  
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Per-reply inline form
  const [activeReplyId, setActiveReplyId] = useState(null); // id of reply being responded to
  const [replyText, setReplyText] = useState('');
  const [activeReactionId, setActiveReactionId] = useState(null); // for showing reaction popup

  // Notes
  const [noteText, setNoteText] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  // Review
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  // Materials & Submissions
  const [materials, setMaterials] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [uploading, setUploading] = useState(false);

  // New Comment Image state
  const [commentImage, setCommentImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post('/upload/user-image', formData);
      setCommentImage(res.data.data.url);
      toast.success('Đã tải ảnh lên');
    } catch(err) { toast.error('Tải ảnh thất bại'); }
    setImageUploading(false);
  };

  const handleReact = async (id, type) => {
    try {
      const res = await api.post(`/comments/${id}/react`, { type });
      const newReactions = JSON.stringify(res.data.data);

      if (viewingQuestion) {
        if (viewingQuestion.id === id) {
          setViewingQuestion({ ...viewingQuestion, reactions: newReactions });
        } else {
          const updatedReplies = viewingQuestion.replies.map(r => {
            if (r.id === id) return { ...r, reactions: newReactions };
            const updatedSubReplies = r.replies?.map(sub => 
              sub.id === id ? { ...sub, reactions: newReactions } : sub
            );
            return { ...r, replies: updatedSubReplies };
          });
          setViewingQuestion({ ...viewingQuestion, replies: updatedReplies });
        }
      }
    } catch(err) { toast.error('Lỗi khi tương tác'); }
  };

  const renderReactions = (comment) => {
    if (!comment.reactions) return null;
    try {
      const reactions = typeof comment.reactions === 'string' ? JSON.parse(comment.reactions) : comment.reactions;
      const total = Object.values(reactions).reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0);
      if (total === 0) return null;

      const activeTypes = Object.entries(reactions).filter(([_, list]) => list.length > 0);

      return (
        <div className="fb-reaction-summary">
          <div className="fb-reaction-icons">
             {reactions.like?.length > 0 && <span className="react-icon like">👍</span>}
             {reactions.heart?.length > 0 && <span className="react-icon heart">❤️</span>}
             {reactions.haha?.length > 0 && <span className="react-icon haha">😆</span>}
             {reactions.wow?.length > 0 && <span className="react-icon wow">😮</span>}
             {activeTypes.length > 2 && <span className="react-more">...</span>}
          </div>
          <span className="react-count">{total}</span>
        </div>
      );
    } catch(e) { return null; }
  };

  const ReactionPopup = ({ onSelect, onClose }) => (
    <div className="fb-reaction-popup" onMouseLeave={onClose}>
      <button onClick={() => onSelect('like')} title="Thích">👍</button>
      <button onClick={() => onSelect('heart')} title="Yêu thích">❤️</button>
      <button onClick={() => onSelect('care')} title="Thương thương">🥰</button>
      <button onClick={() => onSelect('haha')} title="Haha">😆</button>
      <button onClick={() => onSelect('wow')} title="Wow">😮</button>
      <button onClick={() => onSelect('sad')} title="Buồn">😢</button>
      <button onClick={() => onSelect('angry')} title="Phẫn nộ">😡</button>
    </div>
  );

  const REACTION_META = {
    like:  { emoji: '👍', label: 'Thích',         color: '#1877f2' },
    heart: { emoji: '❤️', label: 'Yêu thích',    color: '#e0245e' },
    care:  { emoji: '🥰', label: 'Thương thương', color: '#f7b125' },
    haha:  { emoji: '😆', label: 'Haha',           color: '#f7b125' },
    wow:   { emoji: '😮', label: 'Wow',            color: '#f7b125' },
    sad:   { emoji: '😢', label: 'Buồn',           color: '#f7b125' },
    angry: { emoji: '😡', label: 'Phẫn nộ',      color: '#e9710f' },
  };

  // Facebook-style like button: default gray text, hover popup, colored after reacting
  const FbLikeBtn = ({ commentId, myReactions = {} }) => {
    const [showPopup, setShowPopup] = useState(false);
    const [myReact, setMyReact] = useState(null);
    const timerRef = useRef(null);
    const meta = myReact ? REACTION_META[myReact] : null;

    const doReact = (type) => {
      const next = myReact === type ? null : type;
      setMyReact(next);
      handleReact(commentId, type);
      setShowPopup(false);
    };

    return (
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <button
          className="fb-action-btn"
          onMouseEnter={() => { timerRef.current = setTimeout(() => setShowPopup(true), 500); }}
          onMouseLeave={() => clearTimeout(timerRef.current)}
          onClick={() => doReact(myReact || 'like')}
          style={{ color: meta ? meta.color : undefined, fontWeight: meta ? 700 : undefined }}
        >
          {meta ? `${meta.emoji} ${meta.label}` : 'Thích'}
        </button>
        {showPopup && <ReactionPopup onSelect={doReact} onClose={() => setShowPopup(false)} />}
      </div>
    );
  };

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    
    api.get(`/courses/${slug}/learn`)
      .then(res => {
        const courseData = res.data.data;
        setCourse(courseData);

        api.get(`/courses/${courseData.id}/enrollment`).then(enrollRes => {
          if (!enrollRes.data.data.enrolled) {
            toast.error('Bạn chưa đăng ký khóa học này');
            navigate(`/courses/${slug}`);
            return;
          }
          setProgress(enrollRes.data.data.enrollment.progress || []);
        }).catch(() => {
          toast.error('Không tải được tiến độ học tập');
        });

        if (lessonId) {
          const found = courseData.lessons.find(l => l.id === parseInt(lessonId, 10));
          if (!found) {
            toast.error('Bài học không tồn tại');
            if (courseData.lessons.length > 0) {
              navigate(`/learn/${slug}/${courseData.lessons[0].id}`, { replace: true });
            }
          } else {
            setActiveLesson(found);
          }
        } else if (courseData.lessons.length > 0) {
          setActiveLesson(courseData.lessons[0]);
        }

        const userReview = courseData.reviews?.find(r => r.user?.id === user?.id || r.userId === user?.id);
        if (userReview) {
          setExistingReview(userReview);
          setReviewRating(userReview.rating);
          setReviewComment(userReview.comment || '');
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message;
        if (err.response?.status === 403) {
          toast.error(msg || 'Bạn chưa đăng ký khóa học này');
          navigate(`/courses/${slug}`);
        } else {
          toast.error(msg || 'Không tải được khóa học');
          navigate('/courses');
        }
      })
      .finally(() => setLoading(false));
  }, [slug, lessonId]);

  // Load notes from localStorage
  useEffect(() => {
    if (activeLesson) {
      const saved = localStorage.getItem(`note_${activeLesson.id}`);
      setNoteText(saved || '');
      setNoteSaved(false);
    }
  }, [activeLesson]);

  useEffect(() => {
    if (activeLesson && course) {
      const query = qaFilter === 'current' ? `lessonId=${activeLesson.id}` : `courseId=${course.id}`;
      api.get(`/comments?${query}`).then(res => {
        setComments(res.data.data);
        if (viewingQuestion) {
          const updated = res.data.data.find(c => c.id === viewingQuestion.id);
          if (updated) setViewingQuestion(updated);
        }
      }).catch(() => {});
    }
  }, [activeLesson, qaFilter]);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!newComment.trim() && !commentImage) return;
    setSubmitting(true);
    try {
      const res = await api.post('/comments', { 
        lessonId: activeLesson.id, courseId: course.id, content: newComment,
        image: commentImage
      });
      setComments([res.data.data, ...comments]);
      setNewComment('');
      setCommentImage(null);
      setIsAsking(false);
      toast.success('Đã gửi câu hỏi');
    } catch { toast.error('Lỗi khi gửi câu hỏi'); }
    finally { setSubmitting(false); }
  };

  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/comments', { 
        lessonId: activeLesson.id, courseId: course.id, content: newComment, parentId 
      });
      const query = qaFilter === 'current' ? `lessonId=${activeLesson.id}` : `courseId=${course.id}`;
      const res = await api.get(`/comments?${query}`);
      setComments(res.data.data);
      if (viewingQuestion) {
        setViewingQuestion(res.data.data.find(c => c.id === viewingQuestion.id));
      }
      setNewComment('');
      toast.success('Đã gửi phản hồi');
    } catch { toast.error('Lỗi khi gửi phản hồi'); }
    finally { setSubmitting(false); }
  };

  // Quick reply to a specific reply in thread (@mention pre-filled)
  const handleQuickReply = async (parentCommentId) => {
    if (!replyText.trim() && !commentImage) return;
    setSubmitting(true);
    try {
      await api.post('/comments', {
        lessonId: activeLesson.id, courseId: course.id,
        content: replyText, parentId: parentCommentId,
        image: commentImage
      });
      const query = qaFilter === 'current' ? `lessonId=${activeLesson.id}` : `courseId=${course.id}`;
      const res = await api.get(`/comments?${query}`);
      setComments(res.data.data);
      if (viewingQuestion) setViewingQuestion(res.data.data.find(c => c.id === viewingQuestion.id));
      setReplyText('');
      setCommentImage(null);
      setActiveReplyId(null);
      toast.success('Đã gửi phản hồi');
    } catch { toast.error('Lỗi khi gửi phản hồi'); }
    finally { setSubmitting(false); }
  };

  const handleComplete = async () => {
    try {
      await api.post(`/courses/${course.id}/lessons/${activeLesson.id}/progress`);
      toast.success('Đã hoàn thành bài học!');
      // Re-fetch full progress from server
      const enrollRes = await api.get(`/courses/${course.id}/enrollment`);
      setProgress(enrollRes.data.data.enrollment.progress || []);
      const currentIndex = course.lessons.findIndex(l => l.id === activeLesson.id);
      if (currentIndex < course.lessons.length - 1) {
        const next = course.lessons[currentIndex + 1];
        navigate(`/learn/${slug}/${next.id}`);
      }
    } catch { toast.error('Lỗi khi cập nhật tiến độ'); }
  };

  const handleSaveNote = () => {
    localStorage.setItem(`note_${activeLesson.id}`, noteText);
    setNoteSaved(true);
    toast.success('Ghi chú đã được lưu!');
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) return toast.error('Vui lòng chọn số sao');
    setReviewSubmitting(true);
    try {
      await api.post(`/courses/${course.id}/reviews`, {
        rating: reviewRating, comment: reviewComment,
      });
      toast.success(existingReview ? 'Đã cập nhật đánh giá!' : 'Cảm ơn bạn đã đánh giá!');
      setExistingReview({ rating: reviewRating, comment: reviewComment });
      // Re-fetch course to sync reviews & avgRating
      const refreshRes = await api.get(`/courses/${slug}/learn`);
      setCourse(refreshRes.data.data);
    } catch { toast.error('Lỗi khi gửi đánh giá'); }
    finally { setReviewSubmitting(false); }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!course || !activeLesson) return <div>Không tìm thấy nội dung</div>;

  const isCompleted = progress.find(p => p.lessonId === activeLesson.id)?.completed;
  const completedCount = progress.filter(p => p.completed).length;
  const totalLessons = course.lessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const currentIdx = course.lessons.findIndex(l => l.id === activeLesson.id);

  return (
    <div className="course-player">
      {/* Header */}
      <header className="player-header">
        <Link to={`/courses/${slug}`} className="back-btn">
          <ArrowLeft size={18} /> <span>Quay lại</span>
        </Link>
        <div className="course-info">
          <h1 className="course-title-small">{course.title}</h1>
        </div>

        {/* Trophy Progress */}
        <div className="trophy-progress">
          <div className="trophy-ring-container">
            <ProgressRing percent={progressPercent} size={44} stroke={4} />
            <Trophy size={18} className="trophy-icon" />
          </div>
          <span className="trophy-text">{progressPercent}%</span>
        </div>

        <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <div className="player-main">
        {/* Content Area */}
        <div className={`player-content ${sidebarOpen ? 'with-sidebar' : ''}`}>
          <div className="video-container">
            {activeLesson.videoUrl ? (() => {
              // Convert any YouTube URL format to embed URL
              const getEmbedUrl = (url) => {
                if (!url) return '';
                // Already embed
                if (url.includes('youtube.com/embed/')) return url;
                // youtu.be short link
                const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
                if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
                // youtube.com/shorts/
                const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
                if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
                // youtube.com/watch?v=
                const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
                if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
                // Fallback: try basic replace
                return url.replace('watch?v=', 'embed/');
              };
              const embedUrl = getEmbedUrl(activeLesson.videoUrl);
              return (
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  title={activeLesson.title}
                  width="100%" height="100%"
                  style={{ border: 'none', display: 'block' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              );
            })() : (
              <div className="video-placeholder">
                <Play size={48} />
                <p>Không có video cho bài học này</p>
              </div>
            )}
          </div>

          <div className="player-footer">
            <button className="footer-nav-btn" disabled={currentIdx === 0}
              onClick={() => navigate(`/learn/${slug}/${course.lessons[currentIdx - 1].id}`)}>
              <ChevronLeft size={20} /> Bài trước
            </button>
            <div className="footer-center">
              <span className="lesson-counter">Bài {currentIdx + 1} / {totalLessons}</span>
              <button className={`complete-btn ${isCompleted ? 'done' : ''}`} onClick={handleComplete}>
                <CheckCircle size={16} /> {isCompleted ? 'Đã hoàn thành' : 'Hoàn thành'}
              </button>
            </div>
            <button className="footer-nav-btn" disabled={currentIdx === totalLessons - 1}
              onClick={() => navigate(`/learn/${slug}/${course.lessons[currentIdx + 1].id}`)}>
              Bài tiếp theo <ChevronRight size={20} />
            </button>
          </div>

          {/* === TABS === */}
          <div className="player-tabs-nav">
            {['overview','qa','materials','notes','review'].map(t => (
              <button key={t} className={activeTab === t ? 'active' : ''} onClick={() => {
                setActiveTab(t);
                if (t === 'materials' && activeLesson) {
                  api.get(`/lessons/${activeLesson.id}/materials`).then(r => setMaterials(r.data.data || [])).catch(() => {});
                  api.get(`/lessons/${activeLesson.id}/submissions`).then(r => setSubmissions(r.data.data || [])).catch(() => {});
                }
              }}>
                {t === 'overview' && '📋 Tổng quan'}
                {t === 'qa' && '💬 Hỏi đáp'}
                {t === 'materials' && '📁 Tài liệu & Bài tập'}
                {t === 'notes' && '📝 Ghi chú'}
                {t === 'review' && '⭐ Đánh giá'}
              </button>
            ))}
          </div>

          <div className="player-tab-content">
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="lesson-body container">
                <div className="lesson-header">
                  <h2>{activeLesson.title}</h2>
                  <button className={`btn ${isCompleted ? 'btn-secondary' : 'btn-primary'}`} onClick={handleComplete}>
                    {isCompleted ? <><CheckCircle size={18} /> Đã hoàn thành</> : 'Hoàn thành bài học'}
                  </button>
                </div>
                <div className="lesson-content-text" dangerouslySetInnerHTML={{ __html: sanitizeHTML(activeLesson.content) }} />
              </div>
            )}

            {/* Q&A */}
            {activeTab === 'qa' && (
              <div className="qa-section container">
                {!viewingQuestion ? (
                  <>
                    <div className="qa-controls">
                      <div className="qa-search-row">
                        <input type="text" placeholder="Tìm kiếm câu hỏi..." />
                        <button className="btn btn-primary" onClick={() => setIsAsking(!isAsking)}>
                          <MessageSquare size={16} /> Đặt câu hỏi
                        </button>
                      </div>
                      <div className="qa-filter-row">
                        <select value={qaFilter} onChange={e => setQaFilter(e.target.value)}>
                          <option value="current">Bài {currentIdx + 1}</option>
                          <option value="all">Tất cả bài</option>
                        </select>
                      </div>
                    </div>

                    {isAsking && (
                      <form onSubmit={handleAskQuestion} className="qa-ask-form">
                        <div className="qa-avatar-sm">{user?.fullName?.[0] || 'U'}</div>
                        <div className="qa-ask-body">
                          <div style={{ position: 'relative' }}>
                            <textarea rows="3" placeholder="Nội dung câu hỏi..."
                              value={newComment} onChange={e => setNewComment(e.target.value)}
                              style={{ paddingRight: '45px' }} />
                            <label className="fb-upload-btn" style={{ top: '25px' }}>
                              <Camera size={20} />
                              <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                            </label>
                          </div>
                          {commentImage && (
                            <div className="fb-preview-container" style={{ margin: '10px 0' }}>
                              <img src={commentImage} alt="Preview" className="fb-preview-img" />
                              <button type="button" className="fb-preview-remove" onClick={() => setCommentImage(null)}><X size={14} /></button>
                            </div>
                          )}
                          <div className="qa-ask-actions">
                            <button type="button" className="btn btn-ghost" onClick={() => setIsAsking(false)}>Hủy</button>
                            <button type="submit" className="btn btn-primary" disabled={submitting || imageUploading}>
                              {submitting ? 'Đang gửi...' : 'Gửi'}
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    <p className="qa-count">{comments.length} câu hỏi</p>
                    <div className="ud-qa-list">
                      {comments.length === 0 ? (
                        <p className="qa-empty">Chưa có câu hỏi nào. Hãy hỏi đầu tiên!</p>
                      ) : (
                        comments.map(c => (
                          <div key={c.id} className="ud-qa-card" onClick={() => setViewingQuestion(c)}>
                            <div className="ud-qa-avatar">{c.user?.fullName?.[0] || 'U'}</div>
                            <div className="ud-qa-main">
                              <h4 className="ud-qa-title">{c.content.substring(0, 80)}{c.content.length > 80 && '...'}</h4>
                              <div className="ud-qa-meta">
                                <span>{c.user?.fullName}</span>
                                {c.user?.role === 'admin' && <span className="badge badge-primary qa-badge">Admin</span>}
                                <span className="qa-dot">•</span>
                                <span>{new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
                              </div>
                            </div>
                            <div className="ud-qa-stats">
                              <span><MessageSquare size={14} /> {c.replies?.length || 0}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="ud-qa-thread">
                    <button className="btn btn-ghost qa-back" onClick={() => { setViewingQuestion(null); setActiveReplyId(null); setReplyText(''); }}>
                      <ArrowLeft size={16} /> Quay lại
                    </button>
                    
                    {/* Parent comment — Facebook style */}
                    {/* ── PARENT QUESTION (Style FB) ── */}
                    <div className="fb-comment-item">
                      <div className={`fb-avatar ${viewingQuestion.user?.role==='admin'?'avatar-teacher':''}`}>
                        {viewingQuestion.user?.role==='admin' ? '👨‍🏫' : viewingQuestion.user?.fullName?.[0]}
                      </div>
                      <div className="fb-content-wrap">
                        <div className={`fb-bubble ${viewingQuestion.user?.role==='admin'?'is-teacher':''}`}>
                          <strong className="fb-user-name">{viewingQuestion.user?.fullName}</strong>
                          <p className="fb-text">{viewingQuestion.content}</p>
                          {viewingQuestion.image && (
                            <img src={viewingQuestion.image} alt="Bình luận" className="fb-comment-image" onClick={() => window.open(viewingQuestion.image)} />
                          )}
                          {renderReactions(viewingQuestion)}
                        </div>
                        <div className="fb-actions">
                          <span className="fb-time">{new Date(viewingQuestion.createdAt).toLocaleDateString('vi-VN')}</span>
                          <FbLikeBtn commentId={viewingQuestion.id} />
                          <button 
                            className={`fb-action-btn ${activeReplyId === viewingQuestion.id ? 'active' : ''}`}
                            onClick={() => {
                              if (activeReplyId === viewingQuestion.id) { setActiveReplyId(null); setReplyText(''); }
                              else { setActiveReplyId(viewingQuestion.id); setReplyText(''); }
                            }}
                          >
                            💬 Trả lời
                          </button>
                        </div>

                        {/* Inline reply form for Parent Question (FB Style) */}
                        {activeReplyId === viewingQuestion.id && (
                          <div className="fb-comment-item is-reply" style={{ marginTop: '12px', padding: 0 }}>
                            <div className="fb-avatar sm avatar-me">
                              {user?.fullName?.[0]}
                            </div>
                            <div className="fb-content-wrap">
                              <div style={{ position: 'relative' }}>
                                <textarea
                                  rows={1} autoFocus value={replyText} onChange={e => setReplyText(e.target.value)}
                                  onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleQuickReply(viewingQuestion.id); } }}
                                  placeholder={`Nhập phản hồi...`}
                                  style={{ width: '100%', padding: '10px 45px 10px 16px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.9rem', outline: 'none', resize: 'none' }}
                                />
                                <label className="fb-upload-btn" title="Đính kèm ảnh">
                                  <Camera size={20} />
                                  <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                </label>
                              </div>
                              {commentImage && (
                                <div className="fb-preview-container">
                                  <img src={commentImage} alt="Preview" className="fb-preview-img" />
                                  <button className="fb-preview-remove" onClick={() => setCommentImage(null)}><X size={14} /></button>
                                </div>
                              )}
                              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px', paddingLeft: '8px' }}>
                                Nhấn Enter để gửi, Shift + Enter để xuống dòng
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── REPLIES THREAD (FB TREE STYLE) ── */}
                    <div className="fb-replies-group">
                      {viewingQuestion.replies?.map(r => {
                        const isMe = r.user?.id === user?.id;
                        const isTeacher = r.user?.role === 'admin';
                        const isReplyingToThis = activeReplyId === r.id;
                        const displayName = isTeacher ? '👨‍🏫 Giảng Viên' : r.user?.fullName;
                        return (
                          <div key={r.id}>
                            <div className="fb-comment-item is-reply">
                              <div className={`fb-avatar sm ${isTeacher?'avatar-teacher':''}`}>
                                {isTeacher ? '👨‍🏫' : r.user?.fullName?.[0]}
                              </div>
                              <div className="fb-content-wrap">
                                <div className={`fb-bubble ${isTeacher?'is-teacher':''} ${isMe?'is-me':''}`}>
                                  <strong className="fb-user-name">{displayName}</strong>
                                  <p className="fb-text">{r.content}</p>
                                  {r.image && <img src={r.image} alt="Bình luận" className="fb-comment-image" onClick={() => window.open(r.image)} />}
                                  {renderReactions(r)}
                                </div>
                                <div className="fb-actions">
                                  <span className="fb-time">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                                  <FbLikeBtn commentId={r.id} />
                                  <button className={`fb-action-btn ${isReplyingToThis?'active':''}`} onClick={()=>setActiveReplyId(isReplyingToThis?null:r.id)}>💬 Trả lời</button>
                                </div>

                                {isReplyingToThis && (
                                  <div className="fb-comment-item is-reply" style={{ padding: 0, marginTop: '8px' }}>
                                    <div className="fb-avatar sm avatar-me">
                                      {user?.fullName?.[0]}
                                    </div>
                                    <div className="fb-content-wrap">
                                      <div style={{ position: 'relative' }}>
                                        <textarea rows={1} autoFocus value={replyText} onChange={e=>setReplyText(e.target.value)} 
                                          onKeyDown={e=>{if(e.key==='Enter' && !e.shiftKey){e.preventDefault(); handleQuickReply(r.id);}}}
                                          placeholder="Phản hồi..."
                                          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '20px', padding: '8px 45px 8px 16px', fontSize: '0.85rem', outline: 'none', resize: 'none' }} />
                                        <label className="fb-upload-btn">
                                          <Camera size={18} />
                                          <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                      </div>
                                      {commentImage && (
                                        <div className="fb-preview-container">
                                          <img src={commentImage} alt="Preview" className="fb-preview-img" />
                                          <button className="fb-preview-remove" onClick={() => setCommentImage(null)}><X size={14} /></button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* --- LEVEL 3 (Nested in the same vertical line) --- */}
                                {r.replies?.length > 0 && (
                                  <div style={{ marginTop: '4px' }}>
                                    {r.replies.map(sub => {
                                      const subIsMe = sub.user?.id === user?.id;
                                      const subIsAdmin = sub.user?.role === 'admin';
                                      const isReplyingSub = activeReplyId === sub.id;
                                      return (
                                        <div key={sub.id} className="fb-comment-item is-reply" style={{ paddingLeft: '8px' }}>
                                          <div className={`fb-avatar sm ${subIsAdmin?'avatar-teacher':''}`} style={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                                            {subIsAdmin ? '👨‍🏫' : sub.user?.fullName?.[0]}
                                          </div>
                                          <div className="fb-content-wrap">
                                            <div className={`fb-bubble is-sub ${subIsAdmin?'is-teacher':''} ${subIsMe?'is-me':''}`}>
                                              <strong className="fb-user-name" style={{ fontSize: '0.75rem' }}>{subIsAdmin?'Giảng Viên':sub.user?.fullName}</strong>
                                              <p className="fb-text" style={{ fontSize: '0.82rem' }}>{sub.content}</p>
                                              {sub.image && <img src={sub.image} alt="Bình luận" className="fb-comment-image" onClick={() => window.open(sub.image)} />}
                                              {renderReactions(sub)}
                                            </div>
                                            <div className="fb-actions">
                                              <span className="fb-time" style={{ fontSize: '0.65rem' }}>{new Date(sub.createdAt).toLocaleDateString('vi-VN')}</span>
                                              <FbLikeBtn commentId={sub.id} />
                                              <button className="fb-action-btn" onClick={()=>setActiveReplyId(isReplyingSub?null:sub.id)}>💬 Trả lời</button>
                                            </div>
                                            {isReplyingSub && (
                                              <div className="fb-comment-item is-reply" style={{ padding: 0, marginTop: '8px' }}>
                                                <div className="fb-avatar sm avatar-me" style={{ width: 22, height: 22 }}>
                                                  {user?.fullName?.[0]}
                                                </div>
                                                <div className="fb-content-wrap">
                                                  <div style={{ position: 'relative' }}>
                                                    <textarea rows={1} autoFocus value={replyText} onChange={e=>setReplyText(e.target.value)} 
                                                      onKeyDown={e=>{if(e.key==='Enter' && !e.shiftKey){e.preventDefault(); handleQuickReply(r.id);}}}
                                                      placeholder="Phản hồi..."
                                                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '20px', padding: '6px 35px 6px 12px', fontSize: '0.8rem', outline: 'none', resize: 'none' }} />
                                                    <label className="fb-upload-btn">
                                                      <Camera size={16} />
                                                      <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                                    </label>
                                                  </div>
                                                  {commentImage && (
                                                    <div className="fb-preview-container">
                                                      <img src={commentImage} alt="Preview" className="fb-preview-img" />
                                                      <button className="fb-preview-remove" onClick={() => setCommentImage(null)}><X size={14} /></button>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NOTES */}
            {activeTab === 'notes' && (
              <div className="notes-section container">
                <div className="notes-header">
                  <h3><StickyNote size={18} /> Ghi Chú — {activeLesson.title}</h3>
                  <button className={`btn btn-primary btn-sm ${noteSaved ? 'saved' : ''}`} onClick={handleSaveNote}>
                    <Save size={14} /> {noteSaved ? 'Đã lưu ✓' : 'Lưu ghi chú'}
                  </button>
                </div>
                <textarea
                  className="notes-textarea"
                  rows="12"
                  placeholder="Viết ghi chú cho bài học này... (tự động lưu trên máy bạn)"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                />
                <p className="notes-hint">💡 Ghi chú sẽ được lưu trên trình duyệt của bạn cho mỗi bài học.</p>
              </div>
            )}

            {/* REVIEW */}
            {activeTab === 'review' && (
              <div className="review-section container">
                <div className="review-card">
                  <h3>⭐ Đánh Giá Khóa Học</h3>
                  <p className="review-subtitle">
                    {existingReview ? 'Cập nhật đánh giá của bạn:' : 'Bạn nghĩ gì về khóa học này?'}
                  </p>
                  <div className="review-stars-row">
                    {[1,2,3,4,5].map(i => (
                      <Star
                        key={i} size={36}
                        className={`review-star ${i <= (reviewHover || reviewRating) ? 'filled' : ''}`}
                        fill={i <= (reviewHover || reviewRating) ? '#f59e0b' : 'none'}
                        color="#f59e0b"
                        onMouseEnter={() => setReviewHover(i)}
                        onMouseLeave={() => setReviewHover(0)}
                        onClick={() => setReviewRating(i)}
                      />
                    ))}
                    <span className="review-label">
                      {reviewRating === 1 && 'Tệ'}{reviewRating === 2 && 'Kém'}{reviewRating === 3 && 'Bình thường'}
                      {reviewRating === 4 && 'Tốt'}{reviewRating === 5 && 'Tuyệt vời!'}
                    </span>
                  </div>
                  <textarea
                    rows="4" placeholder="Nhận xét về khóa học (tùy chọn)..."
                    className="review-textarea"
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                  />
                  <button className="btn btn-primary" onClick={handleSubmitReview} disabled={reviewSubmitting}>
                    {reviewSubmitting ? 'Đang gửi...' : existingReview ? 'Cập Nhật Đánh Giá' : 'Gửi Đánh Giá'}
                  </button>
                </div>

                {/* All Reviews */}
                {course.reviews?.length > 0 && (
                  <div className="all-reviews">
                    <h3 style={{ marginBottom: '16px' }}>
                      ⭐ {course.avgRating} / 5 — {course.reviews.length} đánh giá
                    </h3>
                    {course.reviews.map((r, i) => (
                      <div key={i} className="review-item">
                        <div className="review-item-header">
                          <div className="qa-avatar-sm">{r.user?.fullName?.[0] || '?'}</div>
                          <div>
                            <strong>{r.user?.fullName}</strong>
                            <div className="review-item-stars">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} size={14} fill={s <= r.rating ? '#f59e0b' : 'none'} color="#f59e0b" />
                              ))}
                            </div>
                          </div>
                          <span className="review-item-date">
                            {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        {r.comment && <p className="review-item-text">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MATERIALS & ASSIGNMENTS */}
            {activeTab === 'materials' && (
              <div className="materials-section container">
                {/* Download Materials */}
                <div className="mat-block">
                  <h3><FileText size={18} /> Tài Liệu Bài Học</h3>
                  {materials.length === 0 ? (
                    <p className="mat-empty">Chưa có tài liệu nào cho bài học này.</p>
                  ) : (
                    <div className="mat-list">
                      {materials.map(m => (
                        <button key={m.id} type="button" className="mat-item"
                          onClick={async () => {
                            try {
                              const res = await api.get(`/materials/${m.id}/download`, { responseType: 'blob' });
                              const url = window.URL.createObjectURL(res.data);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = m.title || 'tai-lieu';
                              a.click();
                              window.URL.revokeObjectURL(url);
                            } catch {
                              toast.error('Không tải được tài liệu');
                            }
                          }}>
                          <div className="mat-icon">
                            <File size={20} />
                            <span className="mat-ext">{m.fileType?.toUpperCase()}</span>
                          </div>
                          <div className="mat-info">
                            <span className="mat-name">{m.title}</span>
                            <span className="mat-size">
                              {m.fileSize ? (m.fileSize / 1024 > 1024 ? `${(m.fileSize/1024/1024).toFixed(1)} MB` : `${(m.fileSize/1024).toFixed(0)} KB`) : ''}
                            </span>
                          </div>
                          <Download size={18} className="mat-dl-icon" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Assignment */}
                <div className="mat-block">
                  <h3><Upload size={18} /> Nộp Bài Tập</h3>
                  <div className="submit-form">
                    <label className="file-drop">
                      <input type="file" hidden onChange={e => setSubmissionFile(e.target.files?.[0] || null)} />
                      {submissionFile ? (
                        <div className="file-selected">
                          <FileText size={20} /> <span>{submissionFile.name}</span>
                          <button type="button" onClick={e => { e.preventDefault(); setSubmissionFile(null); }}><X size={14} /></button>
                        </div>
                      ) : (
                        <div className="file-empty">
                          <Upload size={28} />
                          <p>Kéo thả hoặc nhấn để chọn file</p>
                          <span>PDF, DOCX, ZIP, hình ảnh (tối đa 50MB)</span>
                        </div>
                      )}
                    </label>
                    <textarea rows="2" placeholder="Ghi chú cho giảng viên (tùy chọn)..."
                      value={submissionNote} onChange={e => setSubmissionNote(e.target.value)} />
                    <button className="btn btn-primary" disabled={!submissionFile || uploading}
                      onClick={async () => {
                        if (!submissionFile) return;
                        setUploading(true);
                        try {
                          const fd = new FormData();
                          fd.append('file', submissionFile);
                          fd.append('note', submissionNote);
                          await api.post(`/lessons/${activeLesson.id}/submissions`, fd, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                          });
                          toast.success('Nộp bài thành công!');
                          setSubmissionFile(null);
                          setSubmissionNote('');
                          const r = await api.get(`/lessons/${activeLesson.id}/submissions`);
                          setSubmissions(r.data.data || []);
                        } catch { toast.error('Lỗi nộp bài'); }
                        finally { setUploading(false); }
                      }}>
                      {uploading ? <><Loader2 size={16} className="spin" /> Đang tải lên...</> : <><Upload size={16} /> Nộp Bài</>}
                    </button>
                  </div>
                </div>

                {/* My Submissions */}
                {submissions.length > 0 && (
                  <div className="mat-block">
                    <h3><CheckCircle size={18} /> Bài Tập Đã Nộp</h3>
                    <div className="submissions-list">
                      {submissions.map(s => (
                        <div key={s.id} className={`submission-item ${s.grade === 'graded' ? 'graded' : ''}`}>
                          <div className="sub-file">
                            <FileText size={16} />
                            <span>{s.fileName}</span>
                            <span className="sub-date">{new Date(s.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                          {s.note && <p className="sub-note">📝 {s.note}</p>}
                          <div className="sub-status">
                            {s.grade === 'graded' ? (
                              <>
                                <span className="sub-score">Điểm: <strong>{s.score ?? '—'}</strong></span>
                                {s.feedback && <p className="sub-feedback">💬 {s.feedback}</p>}
                              </>
                            ) : (
                              <span className="sub-pending">⏳ Đang chờ chấm điểm</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className={`player-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-head">
            <h3>Nội dung khóa học</h3>
            <div className="sidebar-progress">
              <div className="sidebar-progress-bar">
                <div className="sidebar-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <span>{completedCount}/{totalLessons} bài hoàn thành</span>
            </div>
          </div>
          <div className="lesson-list">
            {course.lessons.map((lesson, index) => {
              const active = lesson.id === activeLesson.id;
              const completed = progress.find(p => p.lessonId === lesson.id)?.completed;
              return (
                <div 
                  key={lesson.id} 
                  className={`lesson-item ${active ? 'active' : ''} ${completed ? 'completed' : ''}`}
                  onClick={() => navigate(`/learn/${slug}/${lesson.id}`)}
                >
                  <div className="lesson-status">
                    {completed ? (
                      <div className="circle-num circle-done">{index + 1}</div>
                    ) : (
                      <div className="circle-num">{index + 1}</div>
                    )}
                  </div>
                  <div className="lesson-info">
                    <p className="lesson-title">{lesson.title}</p>
                    <span className="lesson-meta">
                      {lesson.videoUrl ? <><Play size={11} /> Video</> : <><BookOpen size={11} /> Bài đọc</>}
                      {lesson.duration && <> • {lesson.duration} phút</>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
