const express = require('express');
const router = express.Router();
const { getStudentByEmail, recordAttendance, getTodaySession } = require('../db');

router.post('/', (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code required' });
  }

  const student = getStudentByEmail(email);

  if (!student || student.access_code !== code) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const session = getTodaySession();
  const zoomUrl = session?.zoom_url || process.env.DEFAULT_ZOOM_URL || null;

  if (session) {
    recordAttendance(student.id, session.id);
  }

  res.json({
    valid: true,
    student: { fullName: student.full_name, email: student.email },
    session: session ? {
      number: session.session_number,
      title: session.title,
      host: session.host,
      date: session.date,
      zoomUrl
    } : null
  });
});

router.get('/student/:email', (req, res) => {
  const { email } = req.params;
  const { getDB } = require('../db');
  const db = getDB();
  
  const student = getStudentByEmail(email);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const attendedSessionIds = db.attendance
    .filter(a => a.student_id === student.id)
    .map(a => a.session_id);

  const sessions = db.sessions.map(s => ({
    ...s,
    attended: attendedSessionIds.includes(s.id)
  }));

  res.json({
    student: {
      fullName: student.full_name,
      email: student.email,
      accessCode: student.access_code
    },
    sessions
  });
});

module.exports = router;
