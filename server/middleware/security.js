/**
 * Security Middleware — Thắng Tin Học
 * Rate Limiting, Input Sanitization, HTTPS Redirect, Audit Logging
 */
const rateLimit = require('express-rate-limit');

// ============================================================
// 1. RATE LIMITING — Chống brute-force & DDoS
// ============================================================

/** Global: max 500 requests / 15 phút per IP */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút.' },
  skip: () => process.env.NODE_ENV === 'development',
});

/** Auth routes: max 20 login/register / 15 phút per IP */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Quá nhiều lần đăng nhập, vui lòng thử lại sau 15 phút.' },
  skip: () => process.env.NODE_ENV === 'development',
});

/** Contact/Registration: max 10 submissions / 15 phút per IP */
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Bạn đã gửi quá nhiều lần, vui lòng thử lại sau.' },
  skip: () => process.env.NODE_ENV === 'development',
});

/** Upload: max 50 uploads / 15 phút */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Quá nhiều file upload, vui lòng thử lại sau.' },
  skip: () => process.env.NODE_ENV === 'development',
});

// ============================================================
// 2. INPUT SANITIZATION — Chống XSS injection vào DB
// ============================================================
const sanitizeInput = (obj) => {
  if (typeof obj === 'string') {
    return obj
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')  // onload=, onclick=, etc.
      .replace(/data:text\/html/gi, '');
  }
  if (Array.isArray(obj)) return obj.map(sanitizeInput);
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(obj)) {
      sanitized[key] = sanitizeInput(val);
    }
    return sanitized;
  }
  return obj;
};

const sanitizeMiddleware = (req, res, next) => {
  // Không sanitize file upload
  if (req.is('multipart/form-data')) return next();
  
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) req.query = sanitizeInput(req.query);
  if (req.params) req.params = sanitizeInput(req.params);
  next();
};

// ============================================================
// 3. HTTPS REDIRECT — Bắt buộc HTTPS khi deploy production
// ============================================================
const httpsRedirect = (req, res, next) => {
  // Bỏ qua HTTPS redirect vì aaPanel đã tự động force HTTPS, 
  // và aaPanel reverse proxy không pass đúng header khiến host bị nhận nhầm thành 127.0.0.1
  next();
};

// ============================================================
// 4. SECURITY HEADERS — Bổ sung thêm trên Helmet
// ============================================================
const extraSecurityHeaders = (req, res, next) => {
  // Cấm cache cho API responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

// ============================================================
// 5. AUDIT LOG — Ghi log login cho bảo mật
// ============================================================
const auditLog = (action) => (req, res, next) => {
  const originalSend = res.json;
  res.json = function (body) {
    if (body?.success) {
      console.log(`[AUDIT] ${new Date().toISOString()} | ${action} | IP: ${req.ip} | ${req.body?.email || 'N/A'}`);
    } else {
      console.warn(`[AUDIT-FAIL] ${new Date().toISOString()} | ${action} FAILED | IP: ${req.ip} | ${req.body?.email || 'N/A'}`);
    }
    return originalSend.call(this, body);
  };
  next();
};

module.exports = {
  globalLimiter,
  authLimiter,
  formLimiter,
  uploadLimiter,
  sanitizeMiddleware,
  httpsRedirect,
  extraSecurityHeaders,
  auditLog,
};
