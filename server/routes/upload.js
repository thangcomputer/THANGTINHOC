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
    cb(new Error('Chi chap nhan file anh (JPEG, PNG, GIF, WebP)'));
  }
};

const uploadUserImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const uploadMedia = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExt = /\.(jpe?g|png|gif|webp|mp4|webm|mov)$/i;
    const allowedMime = /^(image\/|video\/)/;
    if (allowedExt.test(path.extname(file.originalname)) && allowedMime.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chi chap nhan file anh hoac video'));
    }
  },
});

/** URL tuong doi — hoat dong qua reverse proxy /uploads */
function buildPublicFileUrl(req, filename) {
  const siteUrl = (process.env.SITE_URL || '').replace(/\/+$/, '');
  if (siteUrl) return `${siteUrl}/uploads/${filename}`;
  return `/uploads/${filename}`;
}

function sendUploadResponse(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Khong co file' });
  }
  const url = buildPublicFileUrl(req, req.file.filename);
  res.json({ success: true, url, data: { url, filename: req.file.filename } });
}

function pickUploadedFile(req) {
  if (req.file) return req.file;
  const files = req.files;
  if (!files) return null;
  if (files.file?.[0]) return files.file[0];
  if (files.image?.[0]) return files.image[0];
  return null;
}

function handleAdminUpload(req, res) {
  req.file = pickUploadedFile(req);
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Khong co file. Dung field file hoac image.' });
  }
  sendUploadResponse(req, res);
}

// Chap nhan ca field "file" va "image" trong MOT lan parse (tranh loi stream bi doc 2 lan)
const adminUpload = uploadMedia.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]);

router.post('/user-image', authenticate, uploadUserImage.single('image'), (req, res) => {
  sendUploadResponse(req, res);
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
  adminUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Loi upload' });
    }
    handleAdminUpload(req, res);
  });
});

router.post('/image', authenticate, authorize('admin'), uploadUserImage.single('image'), (req, res) => {
  sendUploadResponse(req, res);
});

module.exports = router;
