const express = require('express');
const router = express.Router();
const { getDB, updateSessionZoom, updateSessionUnlockTime } = require('../db');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

router.use((req, res, next) => {
  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

router.get('/sessions', (req, res) => {
  const db = getDB();
  res.json({ sessions: db.sessions });
});

router.put('/sessions/:id', (req, res) => {
  const { id } = req.params;
  const { zoomUrl, unlocksAt } = req.body;
  const db = getDB();
  const session = db.sessions.find(s => s.id === parseInt(id));
  if (!session) return res.status(404).json({ error: 'Session not found' });

  if (zoomUrl !== undefined) {
    updateSessionZoom(parseInt(id), zoomUrl);
  }
  if (unlocksAt !== undefined) {
    updateSessionUnlockTime(parseInt(id), unlocksAt);
  }

  const updated = db.sessions.find(s => s.id === parseInt(id));
  res.json({ success: true, session: updated });
});

router.get('/students', (req, res) => {
  const db = getDB();
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
});

router.get('/attendance', (req, res) => {
  const db = getDB();

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
});

router.get('/stats', (req, res) => {
  const db = getDB();
  const totalStudents = db.students.filter(s => s.paid).length;
  const totalAttendance = db.attendance.length;
  const totalSessions = db.sessions.length;

  res.json({
    totalStudents,
    totalAttendance,
    totalSessions,
    fillRate: totalSessions > 0 ? Math.round((totalAttendance / (totalStudents * totalSessions)) * 100) : 0
  });
});

module.exports = router;