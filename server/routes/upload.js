const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const imageFilter = (req, file, cb) => {
  const allowed = /\.(jpe?g|png|gif|webp)$/i;
  if (allowed.test(path.extname(file.originalname)) && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)'));
  }
};

// Học viên: avatar, ảnh bình luận — tối đa 5MB
const uploadUserImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

// Admin: ảnh + video CMS
const uploadMedia = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExt = /\.(jpe?g|png|gif|webp|mp4|webm|mov)$/i;
    const allowedMime = /^(image\/|video\/)/;
    if (allowedExt.test(path.extname(file.originalname)) && allowedMime.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh hoặc video'));
    }
  },
});

function sendUploadResponse(req, res) {
  if (!req.file) return res.status(400).json({ success: false, message: 'Không có file' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ success: true, url, data: { url, filename: req.file.filename } });
}

// POST /api/upload/user-image — học viên (ảnh nhỏ)
router.post('/user-image', authenticate, uploadUserImage.single('image'), (req, res) => {
  sendUploadResponse(req, res);
});

// POST /api/upload — admin only (ảnh + video)
router.post('/', authenticate, authorize('admin'), (req, res, next) => {
  const handler = uploadMedia.single('file');
  handler(req, res, (err) => {
    if (err && err.code === 'LIMIT_UNEXPECTED_FILE') {
      return uploadMedia.single('image')(req, res, (err2) => {
        if (err2) return res.status(400).json({ success: false, message: err2.message });
        sendUploadResponse(req, res);
      });
    }
    if (err) return res.status(400).json({ success: false, message: err.message });
    sendUploadResponse(req, res);
  });
});

// POST /api/upload/image — admin only (legacy)
router.post('/image', authenticate, authorize('admin'), uploadUserImage.single('image'), (req, res) => {
  sendUploadResponse(req, res);
});

module.exports = router;
