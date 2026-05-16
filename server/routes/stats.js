const express = require('express');
const prisma = require('../lib/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Dashboard stats (admin)
router.get('/dashboard', authenticate, authorize('admin'), async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const userWhere = { role: 'user' };
    const [totalUsers, totalCourses, totalPosts, totalOrders, recentOrders, topCourses, revenue, categories,
      usersRecent, usersPrior, coursesRecent, pendingOrders, unreadContacts, unreadRegistrations, unreadRecruitment] = await Promise.all([
      prisma.user.count({ where: userWhere }),
      prisma.course.count(),
      prisma.post.count(),
      prisma.order.count(),
      prisma.order.findMany({
        take: 5, orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, email: true } }, orderItems: { include: { course: { select: { title: true } } } } },
      }),
      prisma.course.findMany({
        take: 5,
        include: { _count: { select: { enrollments: true } } },
        orderBy: { enrollments: { _count: 'desc' } },
      }),
      prisma.order.aggregate({ where: { status: 'paid' }, _sum: { totalAmount: true } }),
      prisma.category.findMany({
        where: { type: 'course' },
        include: { _count: { select: { courses: true } } }
      }),
      prisma.user.count({ where: { ...userWhere, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { ...userWhere, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      prisma.course.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.contactMessage.count({ where: { isRead: false } }),
      prisma.registration.count({ where: { isRead: false, status: 'pending' } }),
      prisma.teacherApplication.count({ where: { isRead: false, status: 'pending' } }),
    ]);

    const userTrendPct = usersPrior > 0
      ? Math.round(((usersRecent - usersPrior) / usersPrior) * 100)
      : (usersRecent > 0 ? 100 : 0);

    const categoryRatio = categories.map(c => ({ name: c.name, value: c._count.courses }));

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyOrders = await prisma.order.findMany({
      where: { status: 'paid', paidAt: { gte: sixMonthsAgo } },
      select: { totalAmount: true, paidAt: true },
    });

    const monthlyRevenue = {};
    monthlyOrders.forEach(order => {
      const key = order.paidAt ? `${order.paidAt.getFullYear()}-${String(order.paidAt.getMonth() + 1).padStart(2, '0')}` : 'unknown';
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + order.totalAmount;
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers, totalCourses, totalPosts, totalOrders,
          totalRevenue: revenue._sum.totalAmount || 0,
          trends: {
            usersRecent,
            userTrendPct,
            coursesRecent,
            pendingOrders,
            unreadContacts,
            unreadRegistrations,
            unreadRecruitment,
          },
        },
        recentOrders: recentOrders.map(order => ({
          ...order,
          course: order.orderItems[0]?.course // Simplifies for frontend
        })),
        categoryRatio,
        topCourses: topCourses.map(c => ({ ...c, totalStudents: c._count.enrollments })),
        monthlyRevenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, amount })),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Categories
router.get('/categories', async (req, res) => {
  try {
    const { type } = req.query;
    const where = type ? { type } : {};
    const categories = await prisma.category.findMany({ where, orderBy: { name: 'asc' } });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.post('/categories', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, slug, type, description } = req.body;
    const cat = await prisma.category.create({ data: { name, slug, type, description } });
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.delete('/categories/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Đã xóa danh mục' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
