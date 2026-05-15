const SECRET_KEY_PATTERN = /api[_-]?key|secret|password|token|private|credential/i;

function filterPublicSettings(settings) {
  const result = {};
  for (const [key, value] of Object.entries(settings || {})) {
    if (!SECRET_KEY_PATTERN.test(key)) {
      result[key] = value;
    }
  }
  return result;
}

module.exports = { filterPublicSettings };