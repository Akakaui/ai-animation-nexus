const crypto = require('crypto');

function getAdminPassword() {
  const password = String(process.env.ADMIN_PASSWORD || '');
  const minimumLength = process.env.NODE_ENV === 'production' ? 12 : 1;
  if (!password || password.length < minimumLength) {
    throw new Error(`ADMIN_PASSWORD must be configured with at least ${minimumLength} characters`);
  }
  return password;
}

function sign(payload) {
  const secret = getAdminPassword();
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const [encoded, providedSignature] = token.split('.');
  if (!encoded || !providedSignature) return false;
  let expectedSignature;
  try {
    expectedSignature = crypto.createHmac('sha256', getAdminPassword()).update(encoded).digest('base64url');
  } catch (_) {
    return false;
  }
  const same = expectedSignature.length === providedSignature.length && crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature));
  if (!same) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return payload.role === 'admin' && Number(payload.exp) > Date.now();
  } catch (_) {
    return false;
  }
}

function authenticatePassword(password) {
  const expected = getAdminPassword();
  const received = String(password || '');
  const same = received.length === expected.length && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  if (!same) return null;
  return sign({ role: 'admin', exp: Date.now() + 8 * 60 * 60 * 1000 });
}

function extractToken(req) {
  const authorization = String(req.headers.authorization || '');
  if (authorization.startsWith('Bearer ')) return authorization.slice(7);
  return req.headers['x-admin-token'] || '';
}

function requireAdmin(req, res, next) {
  if (!verifyToken(extractToken(req))) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

module.exports = { authenticatePassword, extractToken, requireAdmin, verifyToken };
