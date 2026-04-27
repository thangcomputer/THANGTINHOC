const express = require('express');
const prisma = require('../lib/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Admin: Get all posts
router.get('/admin/all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: { category: true, author: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Get post by ID
router.get('/admin/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { category: true },
    });
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Get all published posts
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 9, categoryId, search, featured } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { isPublished: true };
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (featured === 'true') where.isFeatured = true;
    if (search) where.title = { contains: search };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where, skip, take: parseInt(limit),
        include: { category: true, author: { select: { fullName: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where }),
    ]);

    res.json({ success: true, data: posts, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Get post by slug
router.get('/:slug', async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { slug: req.params.slug },
      include: { category: true, author: { select: { fullName: true, avatar: true } } },
    });
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    // Increment views
    await prisma.post.update({ where: { id: post.id }, data: { views: post.views + 1 } });
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});


// Admin: Create post
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title, slug, excerpt, content, thumbnail, isPublished, isFeatured, categoryId, metaTitle, metaDescription, focusKeyword, tags, tableOfContents } = req.body;
    const post = await prisma.post.create({
      data: {
        title, slug: slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
        excerpt, content, thumbnail,
        isPublished: !!isPublished, isFeatured: !!isFeatured,
        metaTitle: metaTitle || null, metaDescription: metaDescription || null,
        focusKeyword: focusKeyword || null,
        tags: tags || null, tableOfContents: tableOfContents || null,
        categoryId: parseInt(categoryId), authorId: req.user.id,
      },
    });
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Update post
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title, slug, excerpt, content, thumbnail, isPublished, isFeatured, categoryId, metaTitle, metaDescription, focusKeyword, tags, tableOfContents } = req.body;
    const post = await prisma.post.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title, slug, excerpt, content, thumbnail,
        isPublished: !!isPublished, isFeatured: !!isFeatured,
        metaTitle: metaTitle || null, metaDescription: metaDescription || null,
        focusKeyword: focusKeyword || null,
        tags: tags || null, tableOfContents: tableOfContents || null,
        categoryId: parseInt(categoryId),
      },
    });
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Delete post
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prisma.post.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Đã xóa bài viết' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
