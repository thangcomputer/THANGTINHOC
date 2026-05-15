const MIN_PASSWORD_LENGTH = 8;

function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function isMockPaymentAllowed() {
  if (!isProduction()) return true;
  return process.env.ALLOW_MOCK_PAYMENT === 'true';
}

module.exports = {
  MIN_PASSWORD_LENGTH,
  validatePassword,
  isProduction,
  isMockPaymentAllowed,
};