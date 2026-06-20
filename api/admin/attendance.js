const { getDB } = require('../../lib/db');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

module.exports = async (req, res) => {
  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = await getDB();
  const students = db.students.filter(s => s.paid);

  const matrix = students.map(s => {
    const row = { student: { id: s.id, name: s.full_name, email: s.email } };
    db.sessions.forEach(sess => {
      row[`s${sess.session_number}`] = db.attendance.some(
        a => a.student_id === s.id && a.session_id === sess.id
      );
    });
    return row;
  });

  res.json({ sessions: db.sessions, matrix });
};
