const { getDB } = require('../../lib/db');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

module.exports = async (req, res) => {
  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = await getDB();
  const totalStudents = db.students.filter(s => s.paid).length;
  const totalAttendance = db.attendance.length;
  const totalSessions = db.sessions.length;

  res.json({
    totalStudents,
    totalAttendance,
    totalSessions,
    fillRate: totalSessions > 0 ? Math.round((totalAttendance / (totalStudents * totalSessions)) * 100) : 0
  });
};
