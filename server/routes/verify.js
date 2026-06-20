const express = require('express');
const router = express.Router();
const { getStudentByEmail, recordAttendance, getSessionById, isUnlocked, parseUnlockTime } = require('../db');

router.post('/', (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code required' });
  }

  const student = getStudentByEmail(email);

  if (!student || student.access_code !== code) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const db = require('../db');
  const allSessions = db.getDB().sessions;

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySession = allSessions.find(s => s.date === todayStr);

  const nextSession = allSessions
    .filter(s => {
      const t = parseUnlockTime(s.unlocks_at);
      return t && t > new Date();
    })
    .sort((a, b) => parseUnlockTime(a.unlocks_at) - parseUnlockTime(b.unlocks_at))[0];

  const currentOrNext = todaySession || nextSession;

  let zoomUrl = null;
  let sessionInfo = null;

  if (currentOrNext) {
    const sessionUnlocked = isUnlocked(currentOrNext);
    zoomUrl = sessionUnlocked ? (currentOrNext.zoom_url || process.env.DEFAULT_ZOOM_URL || null) : null;
    sessionInfo = {
      number: currentOrNext.session_number,
      title: currentOrNext.title,
      host: currentOrNext.host,
      date: currentOrNext.date,
      zoomUrl,
      is_unlocked: sessionUnlocked,
      unlocks_at: currentOrNext.unlocks_at
    };
    if (todaySession) {
      recordAttendance(student.id, todaySession.id);
    }
  }

  res.json({
    valid: true,
    student: { fullName: student.full_name, email: student.email },
    session: sessionInfo
  });
});

router.get('/student/:email', (req, res) => {
  const { email } = req.params;
  const { getDB, getUnlockedSessions } = require('../db');
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
    zoom_url: null,
    is_unlocked: isUnlocked(s),
    attended: attendedSessionIds.includes(s.id)
  }));

  const unlockedSessions = getUnlockedSessions();
  const currentAndNext = sessions.filter(s => {
    const unl = unlockedSessions.find(u => u.id === s.id);
    return unl && (unl.is_unlocked || unl.zoom_url);
  });

  res.json({
    student: {
      fullName: student.full_name,
      email: student.email,
      accessCode: student.access_code
    },
    sessions,
    currentSession: currentAndNext[0] || null,
    nextSession: currentAndNext[1] || null
  });
});

router.get('/sessions', (req, res) => {
  const { getUnlockedSessions } = require('../db');
  const sessions = getUnlockedSessions();
  res.json({ sessions });
});

module.exports = router;