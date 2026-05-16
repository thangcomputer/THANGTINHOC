const jwt = require('jsonwebtoken');
const prisma = require('../lib/db');
const {
  getClientIp,
  getDeviceId,
  validateUserSession,
  localizeSessionError,
  resolveDeviceIdForAuth,
} = require('../lib/session');

const generateToken = (userId, role, sessionId) => {
  const payload = { id: userId, role };
  if (sessionId) payload.sid = sessionId;
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.sid) {
      return res.status(401).json({
        success: false,
        code: 'SESSION_INVALID',
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, isActive: true, fullName: true },
    });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tai khoan khong ton tai' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tai khoan da bi khoa' });
    }

    const deviceId = await resolveDeviceIdForAuth(req, decoded.sid, user.id);
    if (!deviceId) {
      return res.status(401).json({
        success: false,
        code: 'DEVICE_REQUIRED',
        message: 'Thiếu mã thiết bị. Vui lòng tải lại trang và đăng nhập lại.',
      });
    }

    const ip = getClientIp(req);
    await validateUserSession(decoded.sid, user.id, deviceId, ip);

    req.user = { id: user.id, role: user.role, fullName: user.fullName, sessionId: decoded.sid };
    next();
  } catch (err) {
    localizeSessionError(err);
    const status = err.status || 401;
    return res.status(status).json({
      success: false,
      code: err.code || 'SESSION_INVALID',
      message: err.message || 'Invalid or expired token',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  };
};

const optionalAuthenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  const deviceId = getDeviceId(req);
  if (!deviceId) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.sid) return next();

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) return next();

    const ip = getClientIp(req);
    await validateUserSession(decoded.sid, user.id, deviceId, ip);
    req.user = { id: user.id, role: user.role, sessionId: decoded.sid };
  } catch {
    // Coi như khách nếu phiên không hợp lệ
  }
  next();
};

module.exports = { generateToken, authenticate, authorize, optionalAuthenticate };
