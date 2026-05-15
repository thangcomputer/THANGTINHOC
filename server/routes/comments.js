const express = require('express');
const prisma = require('../lib/db');
const { authenticate } = require('../middleware/auth');
const { isUserEnrolled } = require('../lib/courseAccess');
const router = express.Router();

// Get comments for a lesson or course (public)
router.get('/', async (req, res) => {
  try {
    const { lessonId, courseId } = req.query;
    const where = { parentId: null };
    if (lessonId) where.lessonId = parseInt(lessonId);
    if (courseId) where.courseId = parseInt(courseId);

    const comments = await prisma.comment.findMany({
      where,
      include: { 
        user: { select: { id: true, fullName: true, avatar: true, role: true } },
        replies: {
          include: { 
            user: { select: { id: true, fullName: true, avatar: true, role: true } },
            replies: {
              include: { user: { select: { id: true, fullName: true, avatar: true, role: true } } },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        course: { select: { id: true, title: true, slug: true } },
        lesson: {
          select: {
            id: true, title: true,
            course: { select: { id: true, title: true, slug: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Student: Get my own comments with replies
router.get('/my', authenticate, async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { userId: req.user.id, parentId: null },
      include: {
        user: { select: { id: true, fullName: true, avatar: true, role: true } },
        replies: {
          include: { 
            user: { select: { id: true, fullName: true, avatar: true, role: true } },
            replies: {
              include: { user: { select: { id: true, fullName: true, avatar: true, role: true } } },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        course: { select: { id: true, title: true, slug: true } },
        lesson: {
          select: {
            id: true, title: true,
            course: { select: { id: true, title: true, slug: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Create comment
router.post('/', authenticate, async (req, res) => {
  try {
    const { lessonId, courseId, content, parentId, image } = req.body;
    if (!content && !image) return res.status(400).json({ success: false, message: 'Nội dung bình luận trống' });

    if (req.user.role !== 'admin') {
      if (lessonId) {
        const lesson = await prisma.lesson.findUnique({
          where: { id: parseInt(lessonId) },
          select: { courseId: true },
        });
        if (!lesson) return res.status(404).json({ success: false, message: 'Khong tim thay bai hoc' });
        const enrolled = await isUserEnrolled(req.user.id, lesson.courseId);
        if (!enrolled) {
          return res.status(403).json({ success: false, message: 'Ban phai ghi danh khoa hoc de binh luan' });
        }
      } else if (courseId) {
        const enrolled = await isUserEnrolled(req.user.id, parseInt(courseId));
        if (!enrolled) {
          return res.status(403).json({ success: false, message: 'Ban phai ghi danh khoa hoc de binh luan' });
        }
      }
    }

    const comment = await prisma.comment.create({
      data: {
        userId: req.user.id,
        lessonId: lessonId ? parseInt(lessonId) : null,
        courseId: courseId ? parseInt(courseId) : null,
        parentId: parentId ? parseInt(parentId) : null,
        content: content || "",
        image: image || null,
        reactions: JSON.stringify({ like: [], heart: [], care: [], haha: [], wow: [], sad: [], angry: [] })
      },
      include: { user: { select: { id: true, fullName: true, avatar: true, role: true } } }
    });

    // Notify Admin
    try {
      await prisma.notification.create({
        data: {
          type: 'COMMENT',
          message: `${req.user.fullName || 'Học viên'} vừa gửi câu hỏi / bình luận mới.`,
          data: JSON.stringify({ lessonId, courseId, content: content.substring(0, 100) })
        }
      });
    } catch(err) {}

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Delete comment
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!comment) return res.status(404).json({ success: false, message: 'Bình luận không tồn tại' });
    
    // Only author or admin can delete
    if (req.user.role !== 'admin' && comment.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bình luận này' });
    }

    await prisma.comment.delete({ where: { id: comment.id } });
    res.json({ success: true, message: 'Đã xóa bình luận' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa bình luận' });
  }
});

// React to comment (Like, Heart, etc.)
router.post('/:id/react', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'like', 'heart', etc.
    const userId = req.user.id;

    if (!['like', 'heart', 'care', 'haha', 'wow', 'sad', 'angry'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Loại tương tác không hợp lệ' });
    }

    const comment = await prisma.comment.findUnique({ where: { id: parseInt(id) } });
    if (!comment) return res.status(404).json({ success: false, message: 'Bình luận không tồn tại' });

    let reactions = { like: [], heart: [], care: [], haha: [], wow: [], sad: [], angry: [] };
    if (comment.reactions) {
      try { reactions = JSON.parse(comment.reactions); } catch(e) {}
    }

    // Check if user already reacted with THIS type
    const alreadyReacted = reactions[type].includes(userId);

    // Remove user from ALL reaction types first (toggle behavior or switch reaction)
    Object.keys(reactions).forEach(key => {
      reactions[key] = reactions[key].filter(uid => uid !== userId);
    });

    // If they hadn't reacted with this type specifically, add it
    if (!alreadyReacted) {
      reactions[type].push(userId);
    }

    const updated = await prisma.comment.update({
      where: { id: parseInt(id) },
      data: { reactions: JSON.stringify(reactions) }
    });

    res.json({ success: true, data: reactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
