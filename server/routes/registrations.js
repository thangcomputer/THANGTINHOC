const express = require('express');
const prisma = require('../lib/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Public: Submit registration (course or exam)
router.post('/', async (req, res) => {
  try {
    const { type, fullName, phone, courses, level, schedule, note, birthDate, idNumber, examType } = req.body;
    if (!fullName || !phone || !type) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }
    const reg = await prisma.registration.create({
      data: { type, fullName, phone, courses, level, schedule, note, birthDate, idNumber, examType },
    });
    res.status(201).json({ success: true, data: reg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Get all registrations
router.get('/admin/all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { type, status } = req.query;
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    const regs = await prisma.registration.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: regs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Update status
router.put('/admin/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, isRead } = req.body;
    const data = {};
    if (status !== undefined) data.status = status;
    if (isRead !== undefined) data.isRead = isRead;
    const reg = await prisma.registration.update({ where: { id: parseInt(req.params.id) }, data });
    res.json({ success: true, data: reg });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Delete
router.delete('/admin/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prisma.registration.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Đã xóa' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
