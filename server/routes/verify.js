const express = require('express');
const router = express.Router();
const { getStudentByEmail, recordAttendance, getSessionById, isUnlocked, parseUnlockTime, getSessions, getUnlockedSessions } = require('../../lib/db');

router.post('/', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code required' });
  }

  const student = await getStudentByEmail(email);

  if (!student || student.access_code !== code) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const allSessions = await getSessions();

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
      await recordAttendance(student.id, todaySession.id);
    }
  }

  res.json({
    valid: true,
    student: { fullName: student.full_name, email: student.email },
    session: sessionInfo
  });
});

router.get('/student/:email', async (req, res) => {
  const { email } = req.params;
  const { getAttendance } = require('../../lib/db');

  const student = await getStudentByEmail(email);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const attendanceRecords = await getAttendance();
  const attendedSessionIds = attendanceRecords
    .filter(a => a.student_id === student.id)
    .map(a => a.session_id);

  const allSessions = await getSessions();
  const sessions = allSessions.map(s => ({
    ...s,
    zoom_url: null,
    is_unlocked: isUnlocked(s),
    attended: attendedSessionIds.includes(s.id)
  }));

  const unlockedSessions = await getUnlockedSessions();
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

router.get('/sessions', async (req, res) => {
  const sessions = await getUnlockedSessions();
  res.json({ sessions });
});

module.exports = router;