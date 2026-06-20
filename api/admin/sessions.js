const { getDB } = require('../../lib/db');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

module.exports = async (req, res) => {
  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = await getDB();
  res.json({ sessions: db.sessions });
};
