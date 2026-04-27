const express = require('express');
const prisma = require('../lib/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// --- ADMIN ROUTES (Placed at TOP to avoid shadowing) ---

// Admin: Get all courses (including unpublished)
router.get('/admin/all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: { category: true, _count: { select: { enrollments: true, lessons: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Get course by ID
router.get('/admin/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        category: true,
        lessons: { orderBy: { order: 'asc' } },
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Create course
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title, slug, description, content, requirements, thumbnail, price, originalPrice, level, duration, totalLessons, isPublished, isFeatured, categoryId, hasDocuments, hasLifetimeAccess, hasCertificate } = req.body;
    const course = await prisma.course.create({
      data: { 
        title, 
        slug: slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''), 
        description, content, requirements, thumbnail, 
        price: parseFloat(price) || 0, 
        originalPrice: originalPrice ? parseFloat(originalPrice) : null, 
        level, duration, totalLessons: parseInt(totalLessons) || 0, 
        isPublished: !!isPublished, isFeatured: !!isFeatured,
        hasDocuments: hasDocuments !== undefined ? !!hasDocuments : true,
        hasLifetimeAccess: hasLifetimeAccess !== undefined ? !!hasLifetimeAccess : true,
        hasCertificate: hasCertificate !== undefined ? !!hasCertificate : true,
        categoryId: parseInt(categoryId) 
      },
    });
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Update course
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title, slug, description, content, requirements, thumbnail, price, originalPrice, level, duration, totalLessons, isPublished, isFeatured, categoryId, hasDocuments, hasLifetimeAccess, hasCertificate } = req.body;
    const course = await prisma.course.update({
      where: { id: parseInt(req.params.id) },
      data: { 
        title, slug, description, content, requirements, thumbnail, 
        price: parseFloat(price) || 0, 
        originalPrice: originalPrice ? parseFloat(originalPrice) : null, 
        level, duration, totalLessons: parseInt(totalLessons) || 0, 
        isPublished: !!isPublished, isFeatured: !!isFeatured,
        hasDocuments: hasDocuments !== undefined ? !!hasDocuments : true,
        hasLifetimeAccess: hasLifetimeAccess !== undefined ? !!hasLifetimeAccess : true,
        hasCertificate: hasCertificate !== undefined ? !!hasCertificate : true,
        categoryId: parseInt(categoryId) 
      },
    });
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Delete course
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  const courseId = parseInt(req.params.id);
  try {
    // Manually delete related records to satisfy foreign key constraints
    await prisma.$transaction([
      prisma.progress.deleteMany({ where: { lesson: { courseId } } }),
      prisma.lesson.deleteMany({ where: { courseId } }),
      prisma.enrollment.deleteMany({ where: { courseId } }),
      prisma.review.deleteMany({ where: { courseId } }),
      prisma.comment.deleteMany({ where: { courseId } }),
      prisma.orderItem.deleteMany({ where: { courseId } }),
      prisma.course.delete({ where: { id: courseId } }),
    ]);
    res.json({ success: true, message: 'Đã xóa khóa học' });
  } catch (err) {
    console.error('Delete course error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa khóa học. Có thể khóa học đang có dữ liệu ràng buộc.' });
  }
});

// Admin: Lessons Management
router.post('/:courseId/lessons', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title, content, videoUrl, duration, order, isPreview } = req.body;
    const lesson = await prisma.lesson.create({
      data: { 
        title, content, videoUrl, duration: parseInt(duration), 
        order: parseInt(order), isPreview: !!isPreview, 
        courseId: parseInt(req.params.courseId) 
      }
    });
    res.status(201).json({ success: true, data: lesson });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.put('/:courseId/lessons/:lessonId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title, content, videoUrl, duration, order, isPreview } = req.body;
    const lesson = await prisma.lesson.update({
      where: { id: parseInt(req.params.lessonId) },
      data: { title, content, videoUrl, duration: parseInt(duration), order: parseInt(order), isPreview: !!isPreview }
    });
    res.json({ success: true, data: lesson });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.delete('/:courseId/lessons/:lessonId', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prisma.lesson.delete({ where: { id: parseInt(req.params.lessonId) } });
    res.json({ success: true, message: 'Đã xóa bài học' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});


// --- PUBLIC / CLIENT ROUTES ---

// Get all courses (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 9, categoryId, level, search, featured } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { isPublished: true };
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (level) where.level = level;
    if (featured === 'true') where.isFeatured = true;
    if (search) where.title = { contains: search };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where, skip, take: parseInt(limit),
        include: {
          category: true,
          reviews: { select: { rating: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.count({ where }),
    ]);

    const formatted = courses.map(c => ({
      ...c,
      avgRating: c.reviews.length ? (c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length).toFixed(1) : 0,
      totalStudents: c._count.enrollments,
      reviewCount: c.reviews.length,
    }));

    res.json({ success: true, data: formatted, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Get my enrollments (MUST be before /:slug to avoid matching as slug)
router.get('/my/enrolled', authenticate, async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user.id },
      include: {
        course: { include: { category: true, _count: { select: { lessons: true } } } },
        progress: true,
      },
    });
    res.json({ success: true, data: enrollments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Get related courses
router.get('/:courseId/related', async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { categoryId: true } });
    if (!course) return res.json({ success: true, data: [] });
    
    // Same category, exclude current, published only
    let related = await prisma.course.findMany({
      where: { categoryId: course.categoryId, id: { not: courseId }, isPublished: true },
      take: 4,
      include: { category: true, reviews: { select: { rating: true } }, _count: { select: { enrollments: true } } },
      orderBy: { createdAt: 'desc' },
    });
    
    // If not enough, fill with featured
    if (related.length < 3) {
      const featuredIds = related.map(c => c.id);
      const featured = await prisma.course.findMany({
        where: { id: { notIn: [...featuredIds, courseId] }, isPublished: true, isFeatured: true },
        take: 4 - related.length,
        include: { category: true, reviews: { select: { rating: true } }, _count: { select: { enrollments: true } } },
      });
      related = [...related, ...featured];
    }
    
    const formatted = related.map(c => ({
      ...c,
      avgRating: c.reviews.length ? (c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length).toFixed(1) : 0,
      totalStudents: c._count.enrollments,
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error(err);
    res.json({ success: true, data: [] });
  }
});

// Get course by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        lessons: { orderBy: { order: 'asc' } },
        reviews: {
          include: { user: { select: { fullName: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });

    // Auto-compute totalLessons and totalDuration from actual lessons
    const computedTotalLessons = course.lessons?.length || 0;
    const totalMinutes = course.lessons?.reduce((sum, l) => sum + (l.duration || 0), 0) || 0;
    const computedDuration = totalMinutes >= 60
      ? `${Math.floor(totalMinutes / 60)} giờ ${totalMinutes % 60 > 0 ? totalMinutes % 60 + ' phút' : ''}`
      : `${totalMinutes} phút`;
    const videoLessons = course.lessons?.filter(l => l.videoUrl)?.length || 0;

    res.json({ success: true, data: {
      ...course,
      totalLessons: computedTotalLessons,
      totalDuration: computedDuration,
      totalMinutes,
      videoLessons,
      avgRating: course.reviews.length ? (course.reviews.reduce((s, r) => s + r.rating, 0) / course.reviews.length).toFixed(1) : 0,
      totalStudents: course._count.enrollments,
      reviewCount: course.reviews.length,
    } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});



// Check enrollment
router.get('/:courseId/enrollment', authenticate, async (req, res) => {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId: parseInt(req.params.courseId) } },
      include: { progress: true },
    });
    res.json({ success: true, data: { enrolled: !!enrollment, enrollment } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Add review
router.post('/:courseId/reviews', authenticate, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const review = await prisma.review.upsert({
      where: { userId_courseId: { userId: req.user.id, courseId: parseInt(req.params.courseId) } },
      update: { rating: parseInt(rating), comment },
      create: { userId: req.user.id, courseId: parseInt(req.params.courseId), rating: parseInt(rating), comment },
    });
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Client: Mark Progress
router.post('/:courseId/lessons/:lessonId/progress', authenticate, async (req, res) => {
  try {
    // 1. Get enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId: parseInt(req.params.courseId) } }
    });
    if (!enrollment) return res.status(403).json({ success: false, message: 'Bạn chưa đăng ký khóa học này' });

    // 2. Upsert progress
    const progress = await prisma.progress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: parseInt(req.params.lessonId) } },
      update: { completed: true, completedAt: new Date() },
      create: { enrollmentId: enrollment.id, lessonId: parseInt(req.params.lessonId), completed: true, completedAt: new Date() }
    });

    res.json({ success: true, data: progress });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
