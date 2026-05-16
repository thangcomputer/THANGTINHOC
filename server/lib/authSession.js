const crypto = require('crypto');
const { generateToken } = require('../middleware/auth');
const { getClientIp, getDeviceId, createUserSession, destroyUserSession, localizeSessionWarning } = require('./session');
const { localizeSessionError } = require('./session');

function resolveDeviceId(req) {
  const fromReq = getDeviceId(req);
  if (fromReq) return fromReq;
  return crypto.randomUUID();
}

async function issueAuthSession(req, user) {
  const deviceId = resolveDeviceId(req);
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || null;

  try {
    const { session, sessionWarning } = await createUserSession(
      user.id,
      deviceId,
      ip,
      userAgent
    );
    const token = generateToken(user.id, user.role, session.id);
    const warning = sessionWarning ? localizeSessionWarning(sessionWarning) : null;
    return { token, sessionWarning: warning, deviceId };
  } catch (err) {
    throw localizeSessionError(err);
  }
}

async function logoutUser(userId) {
  await destroyUserSession(userId);
}

module.exports = { issueAuthSession, logoutUser, getDeviceId, resolveDeviceId };