const { getDB } = require('../../lib/db');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

module.exports = async (req, res) => {
  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = await getDB();
  const students = db.students.filter(s => s.paid).map(s => ({
    id: s.id,
    full_name: s.full_name,
    email: s.email,
    whatsapp: s.whatsapp,
    access_code: s.access_code,
    paid: s.paid,
    created_at: s.created_at
  }));

  res.json({ students });
};
