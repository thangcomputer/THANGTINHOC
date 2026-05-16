require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const postRoutes = require('./routes/posts');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const statsRoutes = require('./routes/stats');
const categoryRoutes = require('./routes/categories');
const settingsRoutes = require('./routes/settings');
const uploadRoutes = require('./routes/upload');
const notificationRoutes = require('./routes/notifications');
const commentRoutes = require('./routes/comments');
const contactRoutes = require('./routes/contacts');
const registrationRoutes = require('./routes/registrations');
const recruitmentRoutes = require('./routes/recruitment');

// Security Middleware
const {
  globalLimiter, authLimiter, formLimiter, uploadLimiter,
  sanitizeMiddleware, httpsRedirect, extraSecurityHeaders, auditLog
} = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ===== SECURITY LAYERS =====
// 1. HTTPS Redirect (production)
app.use(httpsRedirect);

// 2. Helmet — Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
app.use(extraSecurityHeaders);

// 3. Global Rate Limiting
app.use(globalLimiter);

// 4. Compression
app.use(compression());

// 5. CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// 6. Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 7. Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 7b. HTTP Parameter Pollution protection
app.use(hpp());

// 8. Input Sanitization — chống XSS injection
app.use(sanitizeMiddleware);

// Static files — chặn thư mục nhạy cảm (tài liệu/bài nộp qua API có auth)
app.use('/uploads', (req, res, next) => {
  const p = req.path.replace(/\\/g, '/');
  if (p.startsWith('/materials/') || p.startsWith('/submissions/')) {
    return res.status(403).json({ success: false, message: 'Truy cập file bị từ chối' });
  }
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Thắng Tin Học API is running 🚀', time: new Date() });
});

// Cache purge (Admin only)
const { authenticate, authorize } = require('./middleware/auth');
app.post('/api/cache/purge', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Disconnect and reconnect Prisma to clear query engine cache
    const prisma = require('./lib/db');
    await prisma.$disconnect();
    await prisma.$connect();

    // Clear Node.js module cache for settings (if any cached)
    const cacheKeys = Object.keys(require.cache).filter(k => k.includes('settings'));
    cacheKeys.forEach(key => delete require.cache[key]);

    // Collect stats
    const stats = {
      prismaReconnected: true,
      modulesCacheCleared: cacheKeys.length,
      serverMemory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      uptime: `${Math.round(process.uptime())}s`,
      timestamp: new Date().toISOString(),
    };

    console.log('[CACHE] 🔄 Cache purged by admin at', stats.timestamp);
    res.json({ success: true, message: 'Cache đã được xóa thành công!', data: stats });
  } catch (err) {
    console.error('[CACHE] Purge error:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa cache' });
  }
});

// Routes — Với Rate Limiting cụ thể
app.use('/api/auth', authLimiter, auditLog('AUTH'), authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/media', require('./routes/media'));
app.use('/api/notifications', notificationRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/contacts', formLimiter, contactRoutes);
app.use('/api/registrations', formLimiter, registrationRoutes);
app.use('/api/recruitment', formLimiter, recruitmentRoutes);
app.use('/api', require('./routes/materials'));
app.use('/api/ai', require('./routes/ai'));

// SEO: sitemap.xml, robots.txt, Schema.org JSON-LD
app.use('/', require('./routes/seo'));

const clientDist = path.join(__dirname, '..', 'client', 'dist');
const adminDist = path.join(__dirname, '..', 'admin', 'dist');
const serveSpaBundles =
  process.env.NODE_ENV === 'production' && process.env.SERVE_FRONTEND !== 'false';

if (serveSpaBundles) {
  // Admin SPA: https://domain.com/admin (no subdomain)
  if (fs.existsSync(adminDist)) {
    app.use('/admin', express.static(adminDist));
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      const p = req.path || '';
      if (!p.startsWith('/admin')) return next();
      res.sendFile(path.join(adminDist, 'index.html'), (err) => (err ? next(err) : null));
    });
    console.log('📎 Admin SPA: /admin →', adminDist);
  }
  // Public site SPA
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      const p = req.path || '';
      if (p.startsWith('/api') || p.startsWith('/uploads') || p.startsWith('/admin')) {
        return next();
      }
      res.sendFile(path.join(clientDist, 'index.html'), (err) => (err ? next(err) : null));
    });
    console.log('📎 Client SPA:', clientDist);
  }
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler — KHÔNG lộ stack trace trong production
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  } else {
    console.error(`[ERROR] ${new Date().toISOString()} | ${req.method} ${req.path} | ${err.message}`);
  }
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Đã xảy ra lỗi, vui lòng thử lại sau.'
      : err.message || 'Internal server error',
  });
});

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is required. Set it in server/.env');
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && !process.env.GOOGLE_CLIENT_ID) {
  console.warn('⚠️  GOOGLE_CLIENT_ID not set — Google login disabled in production');
}

app.listen(PORT, () => {
  console.log(`\n🚀 Thắng Tin Học Server running on port ${PORT}`);
  console.log(`📖 API: http://localhost:${PORT}/api`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
