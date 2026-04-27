const express = require('express');
const prisma = require('../lib/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const where = type ? { type } : {};
    const categories = await prisma.category.findMany({ 
      where, 
      include: { _count: { select: { courses: true, posts: true } } } 
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: CRUD
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, slug, type, description } = req.body;
    const category = await prisma.category.create({
      data: { name, slug: slug || name.toLowerCase().replace(/\s+/g, '-'), type, description }
    });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, slug, type, description } = req.body;
    const category = await prisma.category.update({
      where: { id: parseInt(req.params.id) },
      data: { name, slug, type, description }
    });
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  const categoryId = parseInt(req.params.id);
  try {
    // Delete all courses and posts in this category first
    await prisma.$transaction([
      // Cleanup for each course in category
      prisma.progress.deleteMany({ where: { lesson: { course: { categoryId } } } }),
      prisma.lesson.deleteMany({ where: { course: { categoryId } } }),
      prisma.enrollment.deleteMany({ where: { course: { categoryId } } }),
      prisma.comment.deleteMany({ where: { course: { categoryId } } }),
      prisma.review.deleteMany({ where: { course: { categoryId } } }),
      prisma.orderItem.deleteMany({ where: { course: { categoryId } } }),
      
      prisma.course.deleteMany({ where: { categoryId } }),
      prisma.post.deleteMany({ where: { categoryId } }),
      prisma.category.delete({ where: { id: categoryId } }),
    ]);
    res.json({ success: true, message: 'Đã xóa danh mục và toàn bộ nội dung liên quan' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa danh mục' });
  }
});

module.exports = router;
