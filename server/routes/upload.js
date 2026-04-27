const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

// Image-only upload (legacy)
const uploadImage = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh'));
    }
  },
});

// Media upload (image + video)
const uploadMedia = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for video
  fileFilter: (req, file, cb) => {
    const allowedExt = /jpeg|jpg|png|gif|webp|mp4|webm|mov|avi|mkv/;
    const allowedMime = /image\/|video\//;
    if (allowedExt.test(path.extname(file.originalname).toLowerCase()) || allowedMime.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh hoặc video'));
    }
  },
});

// POST /api/upload — accepts field 'image' or 'file'
router.post('/', authenticate, (req, res, next) => {
  // Try 'file' field first, fallback to 'image'
  const handler = uploadMedia.single('file');
  handler(req, res, (err) => {
    if (err && err.code === 'LIMIT_UNEXPECTED_FILE') {
      // Retry with 'image' field name
      return uploadMedia.single('image')(req, res, (err2) => {
        if (err2) return res.status(400).json({ success: false, message: err2.message });
        if (!req.file) return res.status(400).json({ success: false, message: 'Không có file' });
        const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        res.json({ success: true, url, data: { url, filename: req.file.filename } });
      });
    }
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'Không có file' });
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ success: true, url, data: { url, filename: req.file.filename } });
  });
});

// POST /api/upload/image — image-only (legacy)
router.post('/image', authenticate, uploadImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Không có file' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ success: true, url, data: { url, filename: req.file.filename } });
});

module.exports = router;
