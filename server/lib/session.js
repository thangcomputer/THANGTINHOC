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

  let sessionWarning = null;

  if (existingForUser) {
    const sameDevice = existingForUser.deviceId === deviceId;

    if (sameDevice) {
      const session = await prisma.userSession.update({
        where: { id: existingForUser.id },
        data: {
          ipAddress,
          lastActivityAt: new Date(),
          userAgent: userAgent || existingForUser.userAgent,
        },
      });
      return { session, sessionWarning: null };
    }

    sessionWarning = 'SESSION_DEVICE_WARNING';
    await prisma.userSession.delete({ where: { id: existingForUser.id } });
  }

  const session = await prisma.userSession.create({
    data: {
      userId,
      deviceId,
      ipAddress,
      userAgent: userAgent || null,
    },
  });

  return { session, sessionWarning };
}


async function resolveDeviceIdForAuth(req, sessionId, userId) {
  const fromReq = getDeviceId(req);
  if (fromReq) return fromReq;
  if (!sessionId || !userId) return null;
  const session = await prisma.userSession.findUnique({ where: { id: sessionId } });
  if (session && session.userId === userId) return session.deviceId;
  return null;
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

    const effectiveDeviceId = deviceId || session.deviceId;
  if (session.deviceId !== effectiveDeviceId) {
    const err = new Error('SESSION_DEVICE_MSG');
    err.status = 401;
    err.code = 'SESSION_DEVICE';
    throw err;
  }

  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastActivityAt: new Date(), ipAddress },
  });

  return session;
}

async function destroyUserSession(userId) {
  await prisma.userSession.deleteMany({ where: { userId } });
}

function localizeSessionError(err) {
  const map = {
    SESSION_INVALID: 'Phien dang nhap khong hop le. Vui long dang nhap lai.',
    SESSION_IDLE: 'Phien het han do khong hoat dong 1 gio. Vui long dang nhap lai.',
    SESSION_DEVICE: 'Phien da ket thuc do dang nhap tu thiet bi khac.',
  };
  if (err.code && map[err.code]) err.message = map[err.code];
  return err;
}

function localizeSessionWarning(code) {
  if (code === 'SESSION_DEVICE_WARNING') {
    return 'Canh bao: Tai khoan dang nhap tren thiet bi moi. Phien cu da dang xuat.';
  }
  return code;
}

module.exports = {
  resolveDeviceIdForAuth,
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