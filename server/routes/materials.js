const express = require('express');
const prisma = require('../lib/db');
const { authenticate, authorize } = require('../middleware/auth');
const { isUserEnrolled } = require('../lib/courseAccess');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const ALLOWED_SUBMISSION_EXT = /\.(pdf|docx?|pptx?|xlsx?|zip|rar|png|jpe?g)$/i;

async function userCanAccessLessonMaterials(user, lessonId) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { courseId: true, isPreview: true },
  });
  if (!lesson) return false;
  if (lesson.isPreview) return true;
  return isUserEnrolled(user.id, lesson.courseId);
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'materials');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_SUBMISSION_EXT.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Loại file không được phép'));
    }
  },
});

// ============================================
// MATERIALS (Admin manages per lesson)
// ============================================

// Get materials for a lesson (enrolled or preview lesson)
router.get('/lessons/:lessonId/materials', authenticate, async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    const allowed = await userCanAccessLessonMaterials(req.user, lessonId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Bạn chưa có quyền truy cập tài liệu này' });
    }
    const materials = await prisma.material.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: materials });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Tải file tài liệu (không public qua /uploads)
router.get('/materials/:id/download', authenticate, async (req, res) => {
  try {
    const material = await prisma.material.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { lesson: { select: { id: true } } },
    });
    if (!material) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

    const allowed = await userCanAccessLessonMaterials(req.user, material.lesson.id);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Không có quyền tải file' });
    }

    const filePath = path.join(__dirname, '..', material.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File không tồn tại' });
    }
    res.download(filePath, path.basename(material.fileUrl));
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Upload material to lesson
router.post('/lessons/:lessonId/materials', authenticate, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng chọn file' });
    const { title } = req.body;
    const material = await prisma.material.create({
      data: {
        lessonId: parseInt(req.params.lessonId),
        title: title || req.file.originalname,
        fileUrl: `/uploads/materials/${req.file.filename}`,
        fileType: path.extname(req.file.originalname).replace('.', '').toLowerCase(),
        fileSize: req.file.size,
      },
    });
    res.status(201).json({ success: true, data: material });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Delete material
router.delete('/materials/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const material = await prisma.material.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!material) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    
    // Delete file from disk
    const filePath = path.join(__dirname, '..', material.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    
    await prisma.material.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Đã xóa tài liệu' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ============================================
// SUBMISSIONS (Student submits, Admin reviews)
// ============================================

// Student: Get ALL my submissions (for profile/activity page)
router.get('/submissions/my', authenticate, async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { userId: req.user.id },
      include: {
        lesson: {
          select: {
            id: true, title: true,
            course: { select: { id: true, title: true, slug: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: submissions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Student: Get my submissions for a lesson
router.get('/lessons/:lessonId/submissions', authenticate, async (req, res) => {
  try {
    const where = { lessonId: parseInt(req.params.lessonId) };
    // Non-admin only sees own submissions
    if (req.user.role !== 'admin') where.userId = req.user.id;
    
    const submissions = await prisma.submission.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, avatar: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Get all submissions for a course
router.get('/courses/:courseId/submissions', authenticate, authorize('admin'), async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: parseInt(req.params.courseId) },
      include: { lessons: { select: { id: true } } },
    });
    if (!course) return res.status(404).json({ success: false });
    
    const lessonIds = course.lessons.map(l => l.id);
    const submissions = await prisma.submission.findMany({
      where: { lessonId: { in: lessonIds } },
      include: { 
        user: { select: { id: true, fullName: true, email: true, avatar: true } },
        lesson: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Student: Submit assignment
const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'submissions');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});
const submissionUpload = multer({
  storage: submissionStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_SUBMISSION_EXT.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Loại file không được phép'));
    }
  },
});

router.post('/lessons/:lessonId/submissions', authenticate, submissionUpload.single('file'), async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { courseId: true },
    });
    if (!lesson) return res.status(404).json({ success: false, message: 'Không tìm thấy bài học' });
    if (req.user.role !== 'admin') {
      const enrolled = await isUserEnrolled(req.user.id, lesson.courseId);
      if (!enrolled) {
        return res.status(403).json({ success: false, message: 'Bạn chưa đăng ký khóa học này' });
      }
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng chọn file' });
    const submission = await prisma.submission.create({
      data: {
        lessonId: parseInt(req.params.lessonId),
        userId: req.user.id,
        fileUrl: `/uploads/submissions/${req.file.filename}`,
        fileName: req.file.originalname,
        note: req.body.note || null,
        grade: 'pending',
      },
    });
    res.status(201).json({ success: true, data: submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin: Grade/Feedback submission
router.put('/submissions/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { score, feedback, grade } = req.body;
    const submission = await prisma.submission.update({
      where: { id: parseInt(req.params.id) },
      data: { 
        score: score !== undefined ? parseFloat(score) : undefined, 
        feedback, 
        grade: grade || 'graded' 
      },
    });
    res.json({ success: true, data: submission });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Tải bài nộp (chủ sở hữu hoặc admin)
router.get('/submissions/:id/download', authenticate, async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!submission) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    if (req.user.role !== 'admin' && submission.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    }
    const filePath = path.join(__dirname, '..', submission.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File không tồn tại' });
    }
    res.download(filePath, submission.fileName || path.basename(submission.fileUrl));
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Student: Delete own submission
router.delete('/submissions/:id', authenticate, async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!submission) return res.status(404).json({ success: false });
    if (req.user.role !== 'admin' && submission.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    }
    
    const filePath = path.join(__dirname, '..', submission.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    
    await prisma.submission.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Đã xóa' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
