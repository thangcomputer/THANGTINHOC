const express = require('express');
const prisma = require('../lib/db');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Admin: Get all users
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip, take: parseInt(limit),
        select: { id: true, email: true, fullName: true, phone: true, role: true, isActive: true, createdAt: true, _count: { select: { enrollments: true, orders: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);
    res.json({ success: true, data: users, pagination: { page: parseInt(page), total } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Create new user
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { fullName, email, phone, password, role = 'user' } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu tối thiểu 6 ký tự' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { fullName, email, phone: phone || null, password: hashed, role },
      select: { id: true, email: true, fullName: true, phone: true, role: true, isActive: true, createdAt: true },
    });
    res.status(201).json({ success: true, data: user, message: 'Tạo người dùng thành công' });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo người dùng' });
  }
});

// Admin: Toggle user status
router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
    const updated = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: !user.isActive },
    });
    res.json({ success: true, data: { isActive: updated.isActive } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Change user role
router.put('/:id/role', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { role },
    });
    res.json({ success: true, data: { role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Edit user info
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { email, fullName, phone, role, avatar } = req.body;
    // Check if email belongs to someone else
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== parseInt(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Email đã được sử dụng bởi người khác' });
      }
    }
    const data = { fullName, phone };
    if (email) data.email = email;
    if (role) data.role = role;
    if (avatar !== undefined) data.avatar = avatar;
    
    const updated = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data,
      select: { id: true, email: true, fullName: true, phone: true, role: true, avatar: true, isActive: true },
    });
    res.json({ success: true, data: updated, message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Reset User Password
router.post('/:id/reset-password', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ success: false, message: 'Mật khẩu phải >= 6 ký tự' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { password: hashed },
    });
    res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Delete User
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    if (userId === req.user.id) return res.status(400).json({ success: false, message: 'Không thể xóa chính mình' });
    
    await prisma.$transaction([
      prisma.submission.deleteMany({ where: { userId } }),
      prisma.progress.deleteMany({ where: { enrollment: { userId } } }),
      prisma.enrollment.deleteMany({ where: { userId } }),
      prisma.review.deleteMany({ where: { userId } }),
      prisma.comment.deleteMany({ where: { userId } }),
      prisma.orderItem.deleteMany({ where: { order: { userId } } }),
      prisma.order.deleteMany({ where: { userId } }),
      prisma.post.deleteMany({ where: { authorId: userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);
    
    res.json({ success: true, message: 'Đã xóa người dùng và dữ liệu liên quan' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, message: 'Không thể xóa tài khoản này do có ràng buộc dữ liệu phức tạp' });
  }
});

module.exports = router;
