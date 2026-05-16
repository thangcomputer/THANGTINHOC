const express = require('express');
const prisma = require('../lib/db');
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth');
const { issueAuthSession, logoutUser } = require('../lib/authSession');
const { sendWelcomeEmail, sendAdminNewUserNotify } = require('../lib/mailer');
const { validatePassword, isProduction } = require('../lib/validate');

function userAuthPayload(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
  };
}

async function respondWithSession(req, res, user, message, status = 200) {
  try {
    const { token, sessionWarning } = await issueAuthSession(req, user);
    const body = {
      success: true,
      message,
      data: {
        token,
        user: userAuthPayload(user),
      },
    };
    if (sessionWarning) body.data.sessionWarning = sessionWarning;
    res.status(status).json(body);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      code: err.code,
      message: err.message || 'Lỗi đăng nhập',
    });
  }
}

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { password, fullName, phone } = req.body;
    const email = req.body.email?.toLowerCase();
    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
    }
    const pwdError = validatePassword(password);
    if (pwdError) return res.status(400).json({ success: false, message: pwdError });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, fullName, phone },
    });

    sendWelcomeEmail(user);
    sendAdminNewUserNotify(user);

    try {
      await prisma.notification.create({
        data: {
          type: 'REGISTER',
          message: `Học viên mới: ${fullName} vừa đăng ký tài khoản.`,
          data: JSON.stringify({ email }),
        },
      });
    } catch (err) {}

    await respondWithSession(req, res, user, 'Đăng ký thành công', 201);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const password = req.body.password;
    const email = req.body.email?.toLowerCase();
    if (!password) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa' });
    }
    await respondWithSession(req, res, user, 'Đăng nhập thành công');
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Logout — xóa phiên server
router.post('/logout', authenticate, async (req, res) => {
  try {
    await logoutUser(req.user.id);
    res.json({ success: true, message: 'Đã đăng xuất' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Gia hạn hoạt động (khi chỉ tương tác UI, không gọi API)
router.post('/heartbeat', authenticate, async (req, res) => {
  res.json({ success: true, message: 'ok' });
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, fullName: true, phone: true, avatar: true, role: true, createdAt: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { fullName, phone, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { fullName, phone, avatar },
      select: { id: true, email: true, fullName: true, phone: true, avatar: true, role: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Change password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!await bcrypt.compare(currentPassword, user.password)) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }
    const pwdError = validatePassword(newPassword);
    if (pwdError) return res.status(400).json({ success: false, message: pwdError });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    await logoutUser(req.user.id);
    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { sendPasswordResetEmail } = require('../lib/mailer');

// ... Google Auth Client setup (mock or real) ...
// The user needs to set GOOGLE_CLIENT_ID in .env
// Google OAuth Login
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ success: false, message: 'Missing credential' });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      if (isProduction()) {
        return res.status(503).json({ success: false, message: 'Đăng nhập Google chưa được cấu hình' });
      }
      return res.status(400).json({
        success: false,
        message: 'Cần cấu hình GOOGLE_CLIENT_ID trong môi trường development',
      });
    }

    const googleClient = new OAuth2Client(clientId);
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();

    const email = payload.email.toLowerCase();
    
    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Create user automatically
      const randomPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      user = await prisma.user.create({
        data: {
          email,
          fullName: payload.name,
          avatar: payload.picture,
          password: randomPassword
        }
      });
      sendWelcomeEmail(user);

      // Notify Admin
      try {
        await prisma.notification.create({
          data: {
            type: 'REGISTER',
            message: `Học viên mới: ${payload.name} vừa đăng nhập lần đầu qua Google.`,
            data: JSON.stringify({ email })
          }
        });
      } catch(err) {}
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa' });
    }

    await respondWithSession(req, res, user, 'Đăng nhập thành công');
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi xác thực Google' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Security: Always return success even if email not found to prevent email enumeration
      return res.json({ success: true, message: 'Nếu email tồn tại, link khôi phục đã được gửi.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);
    
    // Set token expiry to 1 hour from now
    const expiresInfo = new Date(Date.now() + 3600000);

    // Save token to DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: tokenHash,
        resetPasswordExpires: expiresInfo
      }
    });

    const resetUrl = `${process.env.SITE_URL || 'http://localhost:5173'}/reset-password?token=${token}&email=${email}`;
    await sendPasswordResetEmail(user, resetUrl);

    res.json({ success: true, message: 'Liên kết khôi phục đã được gửi đến email của bạn.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email?.toLowerCase() } });
    
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      return res.status(400).json({ success: false, message: 'Yêu cầu không hợp lệ hoặc đã hết hạn' });
    }

    if (new Date() > new Date(user.resetPasswordExpires)) {
      return res.status(400).json({ success: false, message: 'Token đã hết hạn. Vui lòng yêu cầu lại.' });
    }

    const isValidToken = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isValidToken) {
      return res.status(400).json({ success: false, message: 'Token không hợp lệ' });
    }

    const pwdError = validatePassword(newPassword);
    if (pwdError) return res.status(400).json({ success: false, message: pwdError });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
    await logoutUser(user.id);

    res.json({ success: true, message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
