const express = require('express');
const prisma = require('../lib/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Public: Submit teacher application
router.post('/', async (req, res) => {
  try {
    const { fullName, phone, email, age, hometown, degree, experience, teachMode, expertise, schedule, note } = req.body;
    if (!fullName || !phone || !email || !degree || !expertise || !schedule) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }
    const app = await prisma.teacherApplication.create({
      data: {
        fullName, phone, email,
        age: age ? parseInt(age) : null,
        hometown, degree, experience: experience || '',
        teachMode: teachMode || 'both',
        expertise: typeof expertise === 'string' ? expertise : JSON.stringify(expertise),
        schedule: typeof schedule === 'string' ? schedule : JSON.stringify(schedule),
        note,
      },
    });
    res.status(201).json({ success: true, data: app });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Get all
router.get('/admin/all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    const apps = await prisma.teacherApplication.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Update
router.put('/admin/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, isRead } = req.body;
    const data = {};
    if (status !== undefined) data.status = status;
    if (isRead !== undefined) data.isRead = isRead;
    const app = await prisma.teacherApplication.update({ where: { id: parseInt(req.params.id) }, data });
    res.json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Delete
router.delete('/admin/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prisma.teacherApplication.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Đã xóa' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
