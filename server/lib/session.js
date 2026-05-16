const prisma = require('./db');

const IDLE_MS = parseInt(process.env.SESSION_IDLE_MINUTES || '60', 10) * 60 * 1000;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = String(forwarded).split(',')[0].trim();
    if (first) return first;
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function getDeviceId(req) {
  const fromHeader = req.headers['x-device-id'];
  const fromBody = req.body?.deviceId;
  const id = (fromHeader || fromBody || '').trim();
  if (!id || id.length < 8 || id.length > 128) return null;
  return id;
}

function isSessionExpired(session) {
  return Date.now() - new Date(session.lastActivityAt).getTime() > IDLE_MS;
}

async function createUserSession(userId, deviceId, ipAddress, userAgent) {
  const existingForUser = await prisma.userSession.findUnique({ where: { userId } });
  const existingForIp = await prisma.userSession.findFirst({
    where: { ipAddress, userId: { not: userId } },
  });

  if (existingForIp) {
    const err = new Error('IP_IN_USE_MSG');
    err.status = 403;
    err.code = 'IP_IN_USE';
    throw err;
  }

  let sessionWarning = null;

  if (existingForUser) {
    const sameDevice = existingForUser.deviceId === deviceId;
    const sameIp = existingForUser.ipAddress === ipAddress;

    if (sameDevice && sameIp) {
      const session = await prisma.userSession.update({
        where: { id: existingForUser.id },
        data: { lastActivityAt: new Date(), userAgent: userAgent || existingForUser.userAgent },
      });
      return { session, sessionWarning: null };
    }

    if (!sameDevice) {
      sessionWarning = 'SESSION_DEVICE_WARNING';
    } else if (!sameIp) {
      const err = new Error('IP_MISMATCH_MSG');
      err.status = 403;
      err.code = 'IP_MISMATCH';
      throw err;
    }

    await prisma.userSession.delete({ where: { id: existingForUser.id } });
  }

  const session = await prisma.userSession.create({
    data: { userId, deviceId, ipAddress, userAgent: userAgent || null },
  });

  return { session, sessionWarning };
}

async function validateUserSession(sessionId, userId, deviceId, ipAddress) {
  const session = await prisma.userSession.findUnique({ where: { id: sessionId } });

  if (!session || session.userId !== userId) {
    const err = new Error('SESSION_INVALID_MSG');
    err.status = 401;
    err.code = 'SESSION_INVALID';
    throw err;
  }

  if (isSessionExpired(session)) {
    await prisma.userSession.delete({ where: { id: session.id } }).catch(() => {});
    const err = new Error('SESSION_IDLE_MSG');
    err.status = 401;
    err.code = 'SESSION_IDLE';
    throw err;
  }

  if (session.deviceId !== deviceId) {
    const err = new Error('SESSION_DEVICE_MSG');
    err.status = 401;
    err.code = 'SESSION_DEVICE';
    throw err;
  }

  if (session.ipAddress !== ipAddress) {
    const err = new Error('SESSION_IP_MSG');
    err.status = 403;
    err.code = 'SESSION_IP';
    throw err;
  }

  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastActivityAt: new Date() },
  });

  return session;
}

async function destroyUserSession(userId) {
  await prisma.userSession.deleteMany({ where: { userId } });
}

const SESSION_MESSAGES = {
  IP_IN_USE: null,
  IP_MISMATCH: null,
  SESSION_INVALID: null,
  SESSION_IDLE: null,
  SESSION_DEVICE: null,
  SESSION_IP: null,
  SESSION_DEVICE_WARNING: null,
};

function localizeSessionError(err) {
  const map = {
    IP_IN_USE: 'Dia chi IP nay da co tai khoan dang nhap. Vui long dang xuat tai khoan kia truoc.',
    IP_MISMATCH: 'Tai khoan da gan voi dia chi IP khac.',
    SESSION_INVALID: 'Phien dang nhap khong hop le. Vui long dang nhap lai.',
    SESSION_IDLE: 'Phien het han do khong hoat dong 1 gio. Vui long dang nhap lai.',
    SESSION_DEVICE: 'Phien da ket thuc do dang nhap tu thiet bi khac.',
    SESSION_IP: 'Phien khong khop dia chi IP.',
  };
  if (err.code && map[err.code]) err.message = map[err.code];
  return err;
}

function localizeSessionWarning(code) {
  if (code === 'SESSION_DEVICE_WARNING') {
    return 'Canh bao: Tai khoan dang nhap thiet bi moi. Phien cu da dang xuat.';
  }
  return code;
}

module.exports = {
  IDLE_MS,
  getClientIp,
  getDeviceId,
  createUserSession,
  validateUserSession,
  destroyUserSession,
  isSessionExpired,
  localizeSessionError,
  localizeSessionWarning,
};
