import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Reply, User, BookOpen, Loader2, Trash2, RefreshCw, ChevronDown, ChevronUp, X, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Loading from '../components/Loading';

const REACTIONS = [
  { type: 'like',  emoji: '👍', label: 'Thích' },
  { type: 'heart', emoji: '❤️', label: 'Yêu thích' },
  { type: 'care',  emoji: '🥰', label: 'Thương thương' },
  { type: 'haha',  emoji: '😆', label: 'Haha' },
  { type: 'wow',   emoji: '😮', label: 'Wow' },
  { type: 'sad',   emoji: '😢', label: 'Buồn' },
  { type: 'angry', emoji: '😡', label: 'Phẫn nộ' },
];

function ReactionSummary({ reactions }) {
  if (!reactions) return null;
  try {
    const r = typeof reactions === 'string' ? JSON.parse(reactions) : reactions;
    const total = Object.values(r).reduce((a, v) => a + (Array.isArray(v) ? v.length : 0), 0);
    if (total === 0) return null;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '2px 8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        {r.like?.length > 0 && '👍'}{r.heart?.length > 0 && '❤️'}{r.haha?.length > 0 && '😆'}{r.wow?.length > 0 && '😮'}
        <strong style={{ color: 'var(--text-secondary)' }}>{total}</strong>
      </span>
    );
  } catch { return null; }
}

function ReactionPopup({ onSelect, onClose }) {
  return (
    <div
      onMouseLeave={onClose}
      style={{
        position: 'absolute', bottom: '100%', left: 0, marginBottom: '6px',
        background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '30px', padding: '6px 10px',
        display: 'flex', gap: '6px', zIndex: 200,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        animation: 'slideUp 0.2s cubic-bezier(0.18,0.89,0.32,1.28)',
      }}
    >
      {REACTIONS.map(({ type, emoji, label }) => (
        <button
          key={type}
          title={label}
          onClick={() => { onSelect(type); onClose(); }}
          style={{
            background: 'none', border: 'none', fontSize: '22px',
            cursor: 'pointer', transition: 'transform 0.15s', padding: '0 2px',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.35)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

const REACTION_COLORS = {
  like: '#1877f2', heart: '#e0245e', care: '#f7b125',
  haha: '#f7b125', wow: '#f7b125', sad: '#f7b125', angry: '#e9710f',
};

function LikeButton({ commentId, onReact }) {
  const [showPopup, setShowPopup] = useState(false);
  const [myReaction, setMyReaction] = useState(null);
  const timerRef = useRef(null);
  const reactionInfo = REACTIONS.find(r => r.type === myReaction);

  const handleReact = (type) => {
    const next = myReaction === type ? null : type;
    setMyReaction(next);
    onReact(commentId, type);
    setShowPopup(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onMouseEnter={() => { timerRef.current = setTimeout(() => setShowPopup(true), 500); }}
        onMouseLeave={() => clearTimeout(timerRef.current)}
        onClick={() => handleReact(myReaction || 'like')}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '0.85rem', fontWeight: 700,
          color: myReaction ? REACTION_COLORS[myReaction] : 'var(--text-muted)',
          padding: '4px 8px', borderRadius: '6px',
          transition: 'color 0.15s',
        }}
        onMouseOver={e => { if (!myReaction) e.currentTarget.style.color = '#1877f2'; }}
        onMouseOut={e => { if (!myReaction) e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        {myReaction ? `${reactionInfo.emoji} ${reactionInfo.label}` : 'Thích'}
      </button>
      {showPopup && (
        <ReactionPopup onSelect={handleReact} onClose={() => setShowPopup(false)} />
      )}
    </div>
  );
}


// *** KEY FIX: Defined OUTSIDE QA so React doesn't unmount/remount on every parent re-render ***
function ReplyBox({ rootComment, parentId, mentionUser, userName, replyText, setReplyText, replyImage, setReplyImage, handleReply, handleImageUpload, imageUploading, submitting, onCancel }) {
  return (
    <div style={{
      marginTop: '10px', padding: '14px',
      background: 'rgba(99,102,241,0.05)',
      border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: '12px',
    }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '8px' }}>
        👨‍🏫 Giảng viên phản hồi{mentionUser ? ` @${mentionUser}` : ` ${userName || ''}`}:
      </div>
      <div style={{ position: 'relative' }}>
        <textarea
          className="form-control"
          rows={3}
          autoFocus
          placeholder="Nhập câu trả lời..."
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply(rootComment, parentId); }}
          style={{ resize: 'vertical', fontSize: '0.88rem', marginBottom: '8px', paddingRight: '48px' }}
        />
        <label style={{
          position: 'absolute', right: '10px', top: '10px',
          cursor: 'pointer', color: '#818cf8',
          background: 'rgba(99,102,241,0.12)', borderRadius: '50%',
          width: '30px', height: '30px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: '0.2s',
        }} title="Đính kèm ảnh">
          <Camera size={16} />
          <input type="file" hidden accept="image/*,.webp" onChange={handleImageUpload} disabled={imageUploading} />
        </label>
      </div>

      {replyImage && (
        <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '8px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          <img src={replyImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button onClick={() => setReplyImage(null)} style={{
            position: 'absolute', top: '2px', right: '2px',
            background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white',
            borderRadius: '50%', width: '18px', height: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}><X size={11} /></button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flex: 1 }}>Ctrl + Enter để gửi nhanh</span>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>
          <X size={13} /> Hủy
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => handleReply(rootComment, parentId)} disabled={submitting || imageUploading}>
          {submitting ? <><Loader2 size={13} className="spinner" /> Đang gửi...</> : <><Reply size={13} /> Gửi phản hồi</>}
        </button>
      </div>
    </div>
  );
}

export default function QA() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeReply, setActiveReply] = useState(null);
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyImage, setReplyImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  const fetchComments = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await api.get('/comments');
      setComments(res.data.data || []);
    } catch { toast.error('Lỗi khi tải Hỏi Đáp'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    fetchComments();
    const iv = setInterval(() => fetchComments(), 30000);
    return () => clearInterval(iv);
  }, [fetchComments]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post('/upload', formData);
      setReplyImage(res.data.data.url);
      toast.success('Đã tải ảnh lên');
    } catch { toast.error('Tải ảnh thất bại'); }
    finally { setImageUploading(false); }
  };

  const handleReact = async (commentId, type) => {
    try {
      await api.post(`/comments/${commentId}/react`, { type });
      fetchComments();
    } catch { toast.error('Lỗi khi tương tác'); }
  };

  const toggleExpand = (id) => {
    setExpandedComments(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const openReply = (comment) => {
    setActiveReply({ parentCommentId: comment.id, replyToId: comment.id, mentionUser: null });
    setReplyText('');
    setReplyImage(null);
    setExpandedComments(prev => new Set([...prev, comment.id]));
  };

  const openReplyToReply = (parentComment, reply) => {
    setActiveReply({ parentCommentId: parentComment.id, replyToId: reply.id, mentionUser: reply.user?.fullName });
    setReplyText('');
    setReplyImage(null);
    setExpandedComments(prev => new Set([...prev, parentComment.id]));
  };

  const handleReply = async (rootComment, specificParentId = null) => {
    if (!replyText.trim() && !replyImage) return toast.error('Vui lòng nhập nội dung hoặc đính kèm ảnh');
    setSubmitting(true);
    try {
      await api.post('/comments', {
        content: replyText,
        parentId: specificParentId || rootComment.id,
        courseId: rootComment.courseId || rootComment.lesson?.course?.id || null,
        lessonId: rootComment.lessonId || null,
        image: replyImage || null,
      });
      toast.success('Đã gửi câu trả lời');
      setReplyText('');
      setReplyImage(null);
      setActiveReply(null);
      fetchComments();
    } catch { toast.error('Lỗi khi gửi trả lời'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa bình luận này?')) return;
    try {
      await api.delete(`/comments/${id}`);
      toast.success('Đã xóa');
      fetchComments();
    } catch { toast.error('Lỗi khi xóa'); }
  };

  const formatTime = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)    return 'Vừa xong';
    if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const getCoursePath = (c) => {
    const courseName = c.course?.title || c.lesson?.course?.title;
    const lessonName = c.lesson?.title;
    if (courseName && lessonName) return { course: courseName, lesson: lessonName };
    if (courseName) return { course: courseName, lesson: null };
    if (lessonName) return { course: null, lesson: lessonName };
    return null;
  };


  if (loading) return <Loading fullPage message="Đang tải Hỏi Đáp..." />;

  return (
    <div className="animate-fade-in">
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <div className="page-header">
        <div className="page-title">
          <h1>Quản Lý Hỏi Đáp</h1>
          <p>Tương tác và giải đáp thắc mắc của học viên
            {' '}({comments.length} câu hỏi,{' '}
            {comments.reduce((n, c) => n + (c.replies?.length || 0), 0)} câu trả lời)
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => fetchComments(true)}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={refreshing ? 'spinner' : ''} />
          {refreshing ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              <MessageSquare size={48} style={{ opacity: 0.15, marginBottom: '12px' }} />
              <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '4px' }}>Chưa có câu hỏi</h3>
              <p style={{ fontSize: '0.875rem' }}>Khi học viên đặt câu hỏi, chúng sẽ hiển thị ở đây.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {comments.map((c, idx) => {
                const path = getCoursePath(c);
                const isExpanded = expandedComments.has(c.id);
                const isReplying = activeReply?.parentCommentId === c.id && activeReply?.replyToId === c.id;
                const hasReplies = c.replies?.length > 0;
                const hasAdminReply = c.replies?.some(r => r.user?.role === 'admin');

                return (
                  <div key={c.id} style={{
                    borderBottom: idx < comments.length - 1 ? '1px solid var(--border-light)' : 'none',
                    transition: 'background 0.2s',
                  }}>
                    {/* ── PARENT COMMENT ── */}
                    <div style={{ padding: '20px 24px' }}>

                      {/* Course breadcrumb */}
                      {path && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          fontSize: '0.72rem', color: 'var(--text-muted)',
                          marginBottom: '10px', padding: '4px 10px', borderRadius: '20px',
                          background: 'var(--bg-subtle)', width: 'fit-content',
                          border: '1px solid var(--border-light)',
                        }}>
                          <BookOpen size={11} />
                          {path.course && <strong style={{ color: 'var(--text-secondary)' }}>{path.course}</strong>}
                          {path.course && path.lesson && <span>›</span>}
                          {path.lesson && <span>{path.lesson}</span>}
                        </div>
                      )}

                      {/* User row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, overflow: 'hidden',
                            fontSize: '0.9rem', fontWeight: 700, color: 'white',
                          }}>
                            {c.user?.avatar
                              ? <img src={c.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                              : (c.user?.fullName?.[0] || <User size={18} color="white" />)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.user?.fullName}</div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{formatTime(c.createdAt)}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {hasAdminReply && (
                            <span style={{
                              fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px',
                              background: 'rgba(16,185,129,0.12)', color: '#10b981',
                              borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)',
                            }}>✓ Đã trả lời</span>
                          )}
                          <button title="Xóa" onClick={() => handleDelete(c.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Content bubble */}
                      <div style={{
                        padding: '12px 16px',
                        background: 'var(--bg-subtle)',
                        borderRadius: '4px 14px 14px 14px',
                        fontSize: '0.9rem', lineHeight: 1.65,
                        border: '1px solid var(--border-light)',
                        marginBottom: '8px', marginLeft: '48px',
                      }}>
                        {c.content}
                        {/* Ảnh đính kèm */}
                        {c.image && (
                          <img src={c.image} alt="Ảnh bình luận"
                            onClick={() => window.open(c.image)}
                            style={{ display: 'block', maxWidth: '240px', maxHeight: '240px', borderRadius: '8px', marginTop: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)' }}
                          />
                        )}
                        {/* Reactions summary */}
                        {c.reactions && <div style={{ marginTop: '6px' }}><ReactionSummary reactions={c.reactions} /></div>}
                      </div>

                      {/* Action bar */}
                      <div style={{ display: 'flex', gap: '4px', marginLeft: '48px', alignItems: 'center' }}>
                        <LikeButton commentId={c.id} onReact={handleReact} />

                        <button
                          onClick={() => isReplying ? setActiveReply(null) : openReply(c)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                            padding: '5px 12px', borderRadius: '20px', border: 'none',
                            background: isReplying ? 'rgba(99,102,241,0.15)' : 'var(--bg-subtle)',
                            color: isReplying ? 'var(--primary)' : 'var(--text-muted)',
                            transition: '0.15s',
                          }}
                        >
                          <Reply size={13} />
                          {isReplying ? 'Hủy' : '💬 Trả lời'}
                        </button>

                        {hasReplies && (
                          <button onClick={() => toggleExpand(c.id)} style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                            padding: '5px 12px', borderRadius: '20px', border: 'none',
                            background: 'var(--bg-subtle)', color: 'var(--text-muted)', transition: '0.15s',
                          }}>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            {isExpanded ? 'Thu gọn' : `${c.replies.length} câu trả lời`}
                          </button>
                        )}
                      </div>

                      {/* Reply input box for parent */}
                      {isReplying && (
                        <div style={{ marginLeft: '48px' }}>
                          <ReplyBox
                            rootComment={c} parentId={null}
                            mentionUser={null} userName={c.user?.fullName}
                            replyText={replyText} setReplyText={setReplyText}
                            replyImage={replyImage} setReplyImage={setReplyImage}
                            handleReply={handleReply} handleImageUpload={handleImageUpload}
                            imageUploading={imageUploading} submitting={submitting}
                            onCancel={() => { setActiveReply(null); setReplyImage(null); }}
                          />
                        </div>
                      )}
                    </div>

                    {/* ── REPLIES THREAD ── */}
                    {isExpanded && hasReplies && (
                      <div style={{
                        marginLeft: '72px', marginRight: '24px', marginBottom: '16px',
                        borderLeft: '2px solid rgba(99,102,241,0.25)',
                        paddingLeft: '16px',
                        display: 'flex', flexDirection: 'column', gap: '8px',
                      }}>
                        {c.replies.map((r) => {
                          const isAdmin = r.user?.role === 'admin';
                          const isReplyingToThis = activeReply?.replyToId === r.id;
                          return (
                            <div key={r.id}>
                              <div style={{
                                padding: '10px 14px',
                                background: isAdmin ? 'rgba(99,102,241,0.07)' : 'var(--bg-subtle)',
                                border: isAdmin ? '1px solid rgba(99,102,241,0.2)' : '1px solid var(--border-light)',
                                borderRadius: isAdmin ? '4px 14px 14px 14px' : '4px 12px 12px 12px',
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                      width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: '0.75rem', fontWeight: 700,
                                      background: isAdmin ? 'linear-gradient(135deg, #6366f1, #818cf8)' : '#374151', color: 'white',
                                    }}>{isAdmin ? '👨‍🏫' : (r.user?.fullName?.[0] || '?')}</div>
                                    <strong style={{ fontSize: '0.82rem', color: isAdmin ? 'var(--primary-light)' : 'var(--text-primary)' }}>
                                      {isAdmin ? '👨‍🏫 Giảng Viên' : r.user?.fullName}
                                    </strong>
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatTime(r.createdAt)}</span>
                                    <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.6 }}><Trash2 size={12} /></button>
                                  </div>
                                </div>

                                <p style={{ margin: '0 0 4px 0', fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{r.content}</p>

                                {/* Ảnh đính kèm reply */}
                                {r.image && (
                                  <img src={r.image} alt="Ảnh" onClick={() => window.open(r.image)}
                                    style={{ display: 'block', maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', marginTop: '6px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)' }}
                                  />
                                )}

                                {/* Reactions summary */}
                                {r.reactions && <div style={{ margin: '4px 0' }}><ReactionSummary reactions={r.reactions} /></div>}

                                {/* Action row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                                  <LikeButton commentId={r.id} onReact={handleReact} />
                                  <button onClick={() => isReplyingToThis ? setActiveReply(null) : openReplyToReply(c, r)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, color: isReplyingToThis ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '10px' }}>
                                    <Reply size={11} /> {isReplyingToThis ? 'Hủy' : '💬 Trả lời'}
                                  </button>
                                </div>
                              </div>

                              {isReplyingToThis && (
                                <ReplyBox
                                  rootComment={c} parentId={r.id}
                                  mentionUser={r.user?.fullName} userName={null}
                                  replyText={replyText} setReplyText={setReplyText}
                                  replyImage={replyImage} setReplyImage={setReplyImage}
                                  handleReply={handleReply} handleImageUpload={handleImageUpload}
                                  imageUploading={imageUploading} submitting={submitting}
                                  onCancel={() => { setActiveReply(null); setReplyImage(null); }}
                                />
                              )}

                              {/* LEVEL 3 */}
                              {r.replies?.length > 0 && (
                                <div style={{ marginLeft: '32px', marginTop: '10px', borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {r.replies.map(sub => {
                                    const subAdmin = sub.user?.role === 'admin';
                                    return (
                                      <div key={sub.id} style={{ padding: '8px 12px', background: subAdmin ? 'rgba(99,102,241,0.03)' : 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: subAdmin ? 'var(--primary)' : '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'white' }}>
                                              {subAdmin ? '👨‍🏫' : (sub.user?.fullName?.[0] || '?')}
                                            </div>
                                            <strong style={{ fontSize: '0.75rem' }}>{subAdmin ? '👨‍🏫 Giảng Viên' : sub.user?.fullName}</strong>
                                          </div>
                                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{formatTime(sub.createdAt)}</span>
                                        </div>
                                        <p style={{ margin: '0 0 4px', fontSize: '0.8rem', lineHeight: 1.5 }}>{sub.content}</p>
                                        {sub.image && (
                                          <img src={sub.image} alt="Ảnh" onClick={() => window.open(sub.image)}
                                            style={{ display: 'block', maxWidth: '160px', maxHeight: '160px', borderRadius: '6px', marginTop: '4px', cursor: 'pointer' }}
                                          />
                                        )}
                                        {sub.reactions && <div style={{ marginTop: '4px' }}><ReactionSummary reactions={sub.reactions} /></div>}

                                        {/* Like for level 3 */}
                                        <div style={{ marginTop: '4px' }}>
                                          <LikeButton commentId={sub.id} onReact={handleReact} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
