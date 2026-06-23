const express = require('express');
const router = express.Router();
const { getSessions, updateSessionZoom, updateSessionUnlockTime, getAllStudents, getAttendance } = require('../../lib/db');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

router.use((req, res, next) => {
  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

router.get('/sessions', async (req, res) => {
  const sessions = await getSessions();
  res.json({ sessions });
});

router.put('/sessions/:id', async (req, res) => {
  const { id } = req.params;
  const { zoomUrl, unlocksAt } = req.body;
  
  if (zoomUrl !== undefined) {
    await updateSessionZoom(parseInt(id), zoomUrl);
  }
  if (unlocksAt !== undefined) {
    await updateSessionUnlockTime(parseInt(id), unlocksAt);
  }

  const sessions = await getSessions();
  const updated = sessions.find(s => s.id === parseInt(id));
  if (!updated) return res.status(404).json({ error: 'Session not found' });
  res.json({ success: true, session: updated });
});

router.get('/students', async (req, res) => {
  const allStudents = await getAllStudents();
  const students = allStudents.filter(s => s.paid).map(s => ({
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

router.get('/attendance', async (req, res) => {
  const allStudents = await getAllStudents();
  const sessions = await getSessions();
  const attendance = await getAttendance();

  const students = allStudents.filter(s => s.paid);

  const matrix = students.map(s => {
    const row = { student: { id: s.id, name: s.full_name, email: s.email } };
    sessions.forEach(sess => {
      row[`s${sess.session_number}`] = attendance.some(
        a => a.student_id === s.id && a.session_id === sess.id
      );
    });
    return row;
  });

  res.json({ sessions, matrix });
});

router.get('/stats', async (req, res) => {
  const allStudents = await getAllStudents();
  const attendance = await getAttendance();
  const sessions = await getSessions();

  const totalStudents = allStudents.filter(s => s.paid).length;
  const totalAttendance = attendance.length;
  const totalSessions = sessions.length;

  res.json({
    totalStudents,
    totalAttendance,
    totalSessions,
    fillRate: totalSessions > 0 ? Math.round((totalAttendance / (totalStudents * totalSessions)) * 100) : 0
  });
});

router.get('/export', async (req, res) => {
  const allStudents = await getAllStudents();
  const paidStudents = allStudents.filter(s => s.paid);

  const header = 'Name,Email,WhatsApp,Access Code,Joined\n';
  const rows = paidStudents.map(s => {
    // Escape quotes and commas
    const name = `"${s.full_name ? s.full_name.replace(/"/g, '""') : ''}"`;
    const email = `"${s.email}"`;
    const whatsapp = `"${s.whatsapp || ''}"`;
    const accessCode = `"${s.access_code || ''}"`;
    const joined = `"${s.created_at ? s.created_at.split('T')[0] : ''}"`;
    return `${name},${email},${whatsapp},${accessCode},${joined}`;
  }).join('\n');

  const csv = header + rows;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
  res.status(200).send(csv);
});

module.exports = router;