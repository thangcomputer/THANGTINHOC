const { generateToken } = require('../middleware/auth');
const { getClientIp, getDeviceId, createUserSession, destroyUserSession, localizeSessionWarning } = require('./session');

async function issueAuthSession(req, user) {
  const deviceId = getDeviceId(req);
  if (!deviceId) {
    const err = new Error('Thieu ma thiet bi. Vui long tai lai trang.');
    err.status = 400;
    throw err;
  }

  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || null;

  try {
    const { session, sessionWarning } = await createUserSession(user.id, deviceId, ip, userAgent);
    const token = generateToken(user.id, user.role, session.id);
    const warning = sessionWarning ? localizeSessionWarning(sessionWarning) : null;
    return { token, sessionWarning: warning };
  } catch (err) {
    const { localizeSessionError } = require('./session');
    throw localizeSessionError(err);
  }
}

async function logoutUser(userId) {
  await destroyUserSession(userId);
}

module.exports = { issueAuthSession, logoutUser, getDeviceId };
