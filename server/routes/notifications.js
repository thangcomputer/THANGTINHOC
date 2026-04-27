const express = require('express');
const prisma = require('../lib/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get admin notifications
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    const unreadCount = await prisma.notification.count({ where: { isRead: false } });
    res.json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Mark all as read
router.put('/read-all', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true, message: 'Đã đánh dấu đọc tất cả' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Mark one as read
router.put('/:id/read', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: parseInt(req.params.id) },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ── Student: Get my notifications (aggregated from orders, submissions, etc.) ──
router.get('/student', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = [];

    // 1. Order notifications
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { orderItems: { include: { course: { select: { title: true, slug: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    for (const o of orders) {
      const courseNames = o.orderItems.map(i => i.course?.title).filter(Boolean).join(', ');
      const statusLabel = o.status === 'paid' ? 'Thanh toán thành công' : o.status === 'pending' ? 'Đang chờ thanh toán' : o.status === 'cancelled' ? 'Đã hủy' : o.status;
      notifications.push({
        id: `order-${o.id}`,
        type: 'ORDER',
        message: `${statusLabel}: ${courseNames}`,
        detail: `Mã đơn: #${o.orderCode} · ${o.totalAmount?.toLocaleString('vi-VN')}đ`,
        link: '/my-activity',
        createdAt: o.createdAt,
        icon: o.status === 'paid' ? 'check' : o.status === 'pending' ? 'clock' : 'x',
      });
    }

    // 2. Graded submission notifications
    const submissions = await prisma.submission.findMany({
      where: { userId, grade: 'graded' },
      include: { lesson: { select: { title: true, course: { select: { title: true, slug: true } } } } },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
    for (const s of submissions) {
      notifications.push({
        id: `sub-${s.id}`,
        type: 'GRADE',
        message: `Bài tập "${s.lesson?.title}" đã được chấm điểm: ${s.score ?? '✓'}`,
        detail: s.feedback ? `Nhận xét: ${s.feedback.substring(0, 80)}` : `Khóa: ${s.lesson?.course?.title}`,
        link: '/my-activity',
        createdAt: s.updatedAt || s.createdAt,
        icon: 'award',
      });
    }

    // 3. Course completion notifications
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: { include: { _count: { select: { lessons: true } } } },
        progress: { where: { completed: true } },
      },
    });
    for (const e of enrollments) {
      const total = e.course._count?.lessons || 0;
      const done = e.progress.length;
      if (total > 0 && done >= total) {
        notifications.push({
          id: `complete-${e.id}`,
          type: 'COMPLETE',
          message: `Chúc mừng! Bạn đã hoàn thành khóa "${e.course.title}"`,
          detail: `${done}/${total} bài học`,
          link: '/my-activity',
          createdAt: e.progress[e.progress.length - 1]?.completedAt || e.updatedAt,
          icon: 'trophy',
        });
      }
    }

    // 4. Teacher reply notifications — two-step: get student comment IDs, then find replies (filter role in JS)
    const myCommentIds = await prisma.comment.findMany({
      where: { userId, parentId: null },
      select: { id: true },
      take: 50,
    }).then(rows => rows.map(r => r.id));

    if (myCommentIds.length > 0) {
      const allReplies = await prisma.comment.findMany({
        where: { parentId: { in: myCommentIds } },
        include: {
          user: { select: { id: true, fullName: true, role: true } },
          parent: {
            include: {
              lesson: { select: { title: true, course: { select: { title: true } } } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
      const adminReplies = allReplies.filter(r => r.user?.role === 'admin');
      for (const r of adminReplies) {
        const courseName = r.parent?.lesson?.course?.title;
        notifications.push({
          id: `reply-${r.id}`,
          type: 'REPLY',
          message: `Giảng viên đã trả lời câu hỏi của bạn${courseName ? ` trong "${courseName}"` : ''}`,
          detail: r.content.substring(0, 80),
          link: '/my-activity',
          createdAt: r.createdAt,
          icon: 'check',
        });
      }
    }

    // Sort by date descending
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: notifications.slice(0, 30) });
  } catch (err) {
    console.error('Student notifications error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
