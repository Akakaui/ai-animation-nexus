const express = require('express');
const router = express.Router();
const { getSessions, updateSessionZoom, updateSessionUnlockTime, getAllStudents, getAttendance, isActiveStudent } = require('../../lib/db');
const { authenticatePassword, requireAdmin } = require('../../lib/admin-auth');

const attempts = new Map();

router.post('/login', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const current = attempts.get(ip) || { count: 0, resetAt: Date.now() + 15 * 60 * 1000 };
  if (Date.now() > current.resetAt) {
    current.count = 0;
    current.resetAt = Date.now() + 15 * 60 * 1000;
  }
  if (current.count >= 10) return res.status(429).json({ error: 'Too many login attempts. Try again later.' });

  try {
    const token = authenticatePassword(req.body && req.body.password);
    if (!token) {
      current.count += 1;
      attempts.set(ip, current);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    attempts.delete(ip);
    return res.json({ success: true, token, expiresIn: 8 * 60 * 60 });
  } catch (error) {
    return res.status(503).json({ error: 'Admin authentication is not configured safely.' });
  }
});

router.use(requireAdmin);

router.get('/sessions', async (req, res) => {
  res.json({ sessions: await getSessions() });
});

router.put('/sessions/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid session id' });
  const { zoomUrl, unlocksAt } = req.body || {};
  if (zoomUrl !== undefined && zoomUrl !== null && zoomUrl !== '') {
    try {
      const parsed = new URL(zoomUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Invalid protocol');
    } catch (_) {
      return res.status(400).json({ error: 'Zoom URL must be a valid HTTP or HTTPS URL' });
    }
    await updateSessionZoom(id, zoomUrl);
  } else if (zoomUrl === null || zoomUrl === '') {
    await updateSessionZoom(id, null);
  }
  if (unlocksAt !== undefined && unlocksAt !== null && unlocksAt !== '') {
    try {
      await updateSessionUnlockTime(id, unlocksAt);
    } catch (_) {
      return res.status(400).json({ error: 'Unlock time must be a valid date' });
    }
  }

  const updated = (await getSessions()).find(session => session.id === id);
  if (!updated) return res.status(404).json({ error: 'Session not found' });
  res.json({ success: true, session: updated });
});

router.get('/students', async (req, res) => {
  const students = (await getAllStudents()).filter(isActiveStudent).map(student => ({
    id: student.id,
    full_name: student.full_name,
    email: student.email,
    whatsapp: student.whatsapp,
    access_code: student.access_code,
    paid: student.paid,
    payment_status: student.payment_status || (student.paid ? 'paid' : 'pending'),
    created_at: student.created_at,
    paid_at: student.paid_at,
  }));
  res.json({ students });
});

router.get('/attendance', async (req, res) => {
  const allStudents = await getAllStudents();
  const sessions = await getSessions();
  const attendance = await getAttendance();
  const students = allStudents.filter(student => student.paid);
  const matrix = students.map(student => {
    const row = { student: { id: student.id, name: student.full_name, email: student.email } };
    sessions.forEach(session => {
      row[`s${session.session_number}`] = attendance.some(record => record.student_id === student.id && record.session_id === session.id);
    });
    return row;
  });
  res.json({ sessions, matrix });
});

router.get('/stats', async (req, res) => {
  const students = (await getAllStudents()).filter(isActiveStudent);
  const attendance = await getAttendance();
  const sessions = await getSessions();
  const denominator = students.length * sessions.length;
  res.json({
    totalStudents: students.length,
    totalAttendance: attendance.length,
    totalSessions: sessions.length,
    fillRate: denominator ? Math.round((attendance.length / denominator) * 100) : 0,
  });
});

router.get('/export', async (req, res) => {
  const paidStudents = (await getAllStudents()).filter(isActiveStudent);
  const escape = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const header = 'Name,Email,WhatsApp,Access Code,Joined,Paid\n';
  const rows = paidStudents.map(student => [
    escape(student.full_name), escape(student.email), escape(student.whatsapp), escape(student.access_code),
    escape(student.created_at ? student.created_at.split('T')[0] : ''), escape(student.paid_at ? student.paid_at.split('T')[0] : ''),
  ].join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
  res.send(header + rows);
});

module.exports = router;
