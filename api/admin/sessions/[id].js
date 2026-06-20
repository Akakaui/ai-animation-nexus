const { getDB, updateSessionZoom, updateSessionUnlockTime } = require('../../../lib/db');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

module.exports = async (req, res) => {
  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionId = parseInt(req.query.id);
  const { zoomUrl, unlocksAt } = req.body;

  const db = await getDB();
  const session = db.sessions.find(s => s.id === sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  if (zoomUrl !== undefined) {
    await updateSessionZoom(sessionId, zoomUrl);
  }
  if (unlocksAt !== undefined) {
    await updateSessionUnlockTime(sessionId, unlocksAt);
  }

  const updatedDb = await getDB();
  const updated = updatedDb.sessions.find(s => s.id === sessionId);
  res.json({ success: true, session: updated });
};
