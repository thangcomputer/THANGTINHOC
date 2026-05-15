const express = require('express');
const prisma = require('../lib/db');
const { authenticate, authorize } = require('../middleware/auth');
const { sendOrderSuccessEmail } = require('../lib/mailer');
const { isMockPaymentAllowed } = require('../lib/validate');

const router = express.Router();

// Create order
router.post('/', authenticate, async (req, res) => {
  try {
    const { courseIds, paymentMethod: rawMethod = 'pending' } = req.body;
    if (!courseIds || !courseIds.length) {
      return res.status(400).json({ success: false, message: 'Không có khóa học nào' });
    }

    const reqUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!reqUser) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại, vui lòng đăng nhập lại' });
    }

    const ids = [...new Set(courseIds.map(Number))].filter((id) => !Number.isNaN(id));
    if (!ids.length) {
      return res.status(400).json({ success: false, message: 'Khong co khoa hoc hop le' });
    }

    const courses = await prisma.course.findMany({ where: { id: { in: ids } } });
    if (courses.length !== ids.length) {
      return res.status(400).json({ success: false, message: 'Mot hoac nhieu khoa hoc khong ton tai' });
    }
    const unpublished = courses.filter((c) => !c.isPublished);
    if (unpublished.length) {
      return res.status(400).json({ success: false, message: 'Khoa hoc chua duoc mo ban' });
    }

    const totalAmount = courses.reduce((sum, c) => sum + c.price, 0);
    let paymentMethod = rawMethod;

    if (paymentMethod === 'mock' && !isMockPaymentAllowed()) {
      return res.status(403).json({ success: false, message: 'Thanh toán demo không khả dụng trên môi trường production' });
    }

    // Khóa miễn phí — tự động thanh toán
    if (totalAmount === 0) {
      paymentMethod = 'free';
    }

    const isInstantPaid = paymentMethod === 'mock' || paymentMethod === 'free';
    const orderCode = `TTH${Date.now()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderCode,
        userId: reqUser.id,
        totalAmount,
        status: isInstantPaid ? 'paid' : 'pending',
        paymentMethod,
        paidAt: isInstantPaid ? new Date() : null,
        orderItems: { create: courses.map(c => ({ courseId: c.id, price: c.price })) },
      },
      include: { orderItems: { include: { course: true } } },
    });

    if (isInstantPaid) {
      for (const courseId of ids) {
        await prisma.enrollment.upsert({
          where: { userId_courseId: { userId: reqUser.id, courseId } },
          update: {},
          create: { userId: reqUser.id, courseId },
        });
      }
      
      // Send email in background
      sendOrderSuccessEmail(reqUser, order);

      // Notify Admin
      try {
        await prisma.notification.create({
          data: {
            type: 'PAYMENT',
            message: `${reqUser.fullName} vừa order và thanh toán ${totalAmount.toLocaleString()}đ (Mock).`,
            data: JSON.stringify({ orderCode, totalAmount, courseCount: courseIds.length })
          }
        });
      } catch(err) {}
    }

    res.status(201).json({ success: true, data: order, message: 'Đặt hàng thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Get my orders
router.get('/my', authenticate, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { orderItems: { include: { course: { select: { title: true, slug: true, thumbnail: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Get all orders
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = status ? { status } : {};
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip, take: parseInt(limit),
        include: {
          user: { select: { fullName: true, email: true } },
          orderItems: { include: { course: { select: { title: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);
    res.json({ success: true, data: orders, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Update order status
router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: { status, paidAt: status === 'paid' ? new Date() : undefined },
    });
    if (status === 'paid') {
      const fullOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { user: true, orderItems: true }
      });
      
      // Auto-enroll
      for (const item of fullOrder.orderItems) {
        await prisma.enrollment.upsert({
          where: { userId_courseId: { userId: fullOrder.userId, courseId: item.courseId } },
          update: {},
          create: { userId: fullOrder.userId, courseId: item.courseId },
        });
      }
      
      // Send email
      sendOrderSuccessEmail(fullOrder.user, fullOrder);

      // Notify Admin
      try {
        await prisma.notification.create({
          data: {
            type: 'PAYMENT',
            message: `${fullOrder.user.fullName} vừa thanh toán thành công đơn hàng ${fullOrder.orderCode} (${fullOrder.totalAmount.toLocaleString()}đ).`,
            data: JSON.stringify({ orderCode: fullOrder.orderCode, totalAmount: fullOrder.totalAmount })
          }
        });
      } catch(err) {}
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Delete an order
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Fetch order with items to know courses and user
    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: true },
    });
    if (order) {
      const courseIds = order.orderItems.map(item => item.courseId);
      // Only remove enrollment if user has NO OTHER paid order for that course
      for (const courseId of courseIds) {
        const otherPaidOrder = await prisma.orderItem.findFirst({
          where: {
            courseId,
            orderId: { not: id },
            order: { userId: order.userId, status: 'paid' },
          },
        });
        if (!otherPaidOrder) {
          await prisma.enrollment.deleteMany({
            where: { userId: order.userId, courseId },
          });
        }
      }
    }
    // Delete order items first, then the order
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.order.delete({ where: { id } });
    res.json({ success: true, message: 'Xóa đơn hàng thành công' });
  } catch (err) {
    console.error('Delete order error:', err);
    res.status(500).json({ success: false, message: 'Xóa đơn hàng thất bại' });
  }
});

// Admin: Manually grant course access (enrollment) for all items in an order
router.post('/:id/grant', authenticate, authorize('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: true },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

    for (const item of order.orderItems) {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: order.userId, courseId: item.courseId } },
        update: {},
        create: { userId: order.userId, courseId: item.courseId },
      });
    }

    // Update order status to paid if it was pending
    if (order.status === 'pending') {
      await prisma.order.update({ where: { id }, data: { status: 'paid', paidAt: new Date() } });
    }

    res.json({ success: true, message: `Đã cấp quyền truy cập ${order.orderItems.length} khóa học` });
  } catch (err) {
    console.error('Grant access error:', err);
    res.status(500).json({ success: false, message: 'Cấp quyền thất bại' });
  }
});

module.exports = router;
