/**
 * Mailer — Thắng Tin Học
 * Sử dụng Resend API qua fetch (HTTP) — không cần SMTP port
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'Thắng Tin Học <onboarding@resend.dev>';
const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
const adminUrl = process.env.ADMIN_URL || 'http://localhost:5174';

const sendEmail = async ({ to, subject, html }) => {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Email error:', data);
      return null;
    }
    console.log('Email sent:', data.id);
    return data;
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

const sendWelcomeEmail = (user) => {
  return sendEmail({
    to: user.email,
    subject: 'Chào mừng bạn đến với Thắng Tin Học!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #2563eb;">Chào mừng ${user.fullName},</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Thắng Tin Học</strong>.</p>
        <p>Chúng tôi rất vui mừng được đồng hành cùng bạn trên con đường chinh phục kỹ năng Tin học văn phòng.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${siteUrl}/login" style="background: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Vào Học Ngay</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #888;">© 2024 Thắng Tin Học</p>
      </div>
    `,
  });
};

const sendAdminNewUserNotify = (user) => {
  return sendEmail({
    to: process.env.EMAIL_USER,
    subject: '🔔 Thông báo: Học viên mới đăng ký',
    html: `
      <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px;">
        <h3>Có một học viên mới vừa đăng ký:</h3>
        <ul>
          <li><strong>Họ tên:</strong> ${user.fullName}</li>
          <li><strong>Email:</strong> ${user.email}</li>
          <li><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</li>
        </ul>
        <a href="${adminUrl}/users">Quản lý người dùng</a>
      </div>
    `,
  });
};

const sendOrderSuccessEmail = (user, order) => {
  return sendEmail({
    to: user.email,
    subject: `Xác nhận đăng ký khóa học - Đơn hàng #${order.orderCode}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #10b981;">Đăng ký khóa học thành công!</h2>
        <p>Chúc mừng ${user.fullName}, bạn đã đăng ký thành công khóa học mới.</p>
        <p><strong>Tổng tiền:</strong> ${new Intl.NumberFormat('vi-VN').format(order.totalAmount)} VND</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${siteUrl}/my-courses" style="background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Học Ngay</a>
        </div>
      </div>
    `,
  });
};

const sendPasswordResetEmail = (user, resetUrl) => {
  return sendEmail({
    to: user.email,
    subject: 'Quên mật khẩu - Thắng Tin Học',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #f59e0b;">Yêu Cầu Lấy Lại Mật Khẩu</h2>
        <p>Chào ${user.fullName}, chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <p>Nhấp vào nút bên dưới để thiết lập mật khẩu mới. Link này sẽ hết hạn trong 1 giờ.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #f59e0b; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Đặt Lại Mật Khẩu</a>
        </div>
        <p>Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này.</p>
      </div>
    `,
  });
};

module.exports = { sendWelcomeEmail, sendAdminNewUserNotify, sendOrderSuccessEmail, sendPasswordResetEmail };
