const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
const metaFile = path.join(__dirname, '..', 'uploads', '_meta.json');

// Load metadata from JSON file
function loadMeta() {
  try {
    if (fs.existsSync(metaFile)) {
      return JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    }
  } catch {}
  return {};
}

// Save metadata to JSON file
function saveMeta(meta) {
  try {
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save meta:', err);
  }
}

function safeFilename(raw) {
  const filename = path.basename(decodeURIComponent(raw || ''));
  if (!filename || filename.includes('..')) return null;
  return filename;
}

function resolveUploadPath(filename) {
  const filePath = path.resolve(uploadDir, filename);
  if (!filePath.startsWith(path.resolve(uploadDir))) return null;
  return filePath;
}

// Helper to build URL for a file
function fileUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

// GET /api/media – list all uploaded images (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    if (!fs.existsSync(uploadDir)) return res.json({ success: true, data: [] });
    const files = await fs.promises.readdir(uploadDir);
    const meta = loadMeta();
    // Filter only image files (including .webp), skip _meta.json
    const images = files.filter(f => /\.(jpe?g|png|gif|webp)$/i.test(f));
    const data = images.map(f => ({
      filename: f,
      url: fileUrl(req, f),
      alt: meta[f]?.alt || '',
      title: meta[f]?.title || '',
    }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('Media list error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// PUT /api/media/:filename – update alt & title metadata (admin only)
router.put('/:filename', authenticate, authorize('admin'), async (req, res) => {
  const filename = safeFilename(req.params.filename);
  if (!filename) return res.status(400).json({ success: false, message: 'Ten file khong hop le' });
  const { alt = '', title = '' } = req.body;
  const filePath = resolveUploadPath(filename);
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy ảnh' });
  }
  const meta = loadMeta();
  meta[filename] = { ...(meta[filename] || {}), alt, title };
  saveMeta(meta);
  res.json({ success: true, message: 'Đã lưu thông tin ảnh' });
});

// DELETE /api/media/:filename – delete an uploaded image (admin only)
router.delete('/:filename', authenticate, authorize('admin'), async (req, res) => {
  const filename = safeFilename(req.params.filename);
  if (!filename) return res.status(400).json({ success: false, message: 'Ten file khong hop le' });
  const filePath = resolveUploadPath(filename);
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ảnh' });
    }
    await fs.promises.unlink(filePath);
    // Remove from metadata too
    const meta = loadMeta();
    delete meta[filename];
    saveMeta(meta);
    res.json({ success: true, message: 'Xóa ảnh thành công' });
  } catch (err) {
    console.error('Delete media error:', err);
    res.status(500).json({ success: false, message: 'Xóa ảnh thất bại' });
  }
});

module.exports = router;
