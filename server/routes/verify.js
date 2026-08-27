const express = require('express');
const router = express.Router();
const { getStudentByEmail, getSessions, getUnlockedSessions, getAttendance, recordAttendance, isUnlocked, parseUnlockTime, publicSession } = require('../../lib/db');

function findCurrentOrNext(sessions, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const todaySession = sessions.find(session => session.date === today);
  if (todaySession) return todaySession;
  return sessions.filter(session => {
    const unlock = parseUnlockTime(session.unlocks_at);
    return unlock && unlock > now;
  }).sort((a, b) => parseUnlockTime(a.unlocks_at) - parseUnlockTime(b.unlocks_at))[0] || null;
}

router.post('/', async (req, res) => {
  const email = String(req.body && req.body.email || '').trim().toLowerCase();
  const code = String(req.body && req.body.code || '').trim().toUpperCase();
  if (!email || !code) return res.status(400).json({ error: 'Email and access code are required' });

  const student = await getStudentByEmail(email);
  if (!student || String(student.access_code || '').toUpperCase() !== code) return res.status(401).json({ error: 'Invalid credentials' });

  const sessions = await getSessions();
  const current = findCurrentOrNext(sessions);
  let sessionInfo = null;
  if (current) {
    const unlocked = isUnlocked(current);
    const zoomUrl = unlocked ? (current.zoom_url || process.env.DEFAULT_ZOOM_URL || null) : null;
    sessionInfo = {
      ...publicSession(current),
      number: current.session_number,
      zoomUrl,
      is_unlocked: unlocked,
    };
    if (unlocked) await recordAttendance(student.id, current.id);
  }

  const attendance = (await getAttendance()).filter(record => record.student_id === student.id).map(record => ({ session_id: record.session_id, verified_at: record.verified_at }));
  res.json({
    valid: true,
    student: { fullName: student.full_name, email: student.email, enrollmentStatus: student.payment_status || (student.paid ? 'paid' : 'free') },
    session: sessionInfo,
    attendance,
  });
});

router.get('/sessions', async (req, res) => {
  const sessions = await getUnlockedSessions();
  // Never expose Zoom URLs through an anonymous schedule request.
  res.json({ sessions: sessions.map(session => ({ ...session, zoom_url: null })) });
});

// Retained as an explicit non-disclosing response for old clients/bookmarks.
router.get('/student/:email', (req, res) => res.status(410).json({ error: 'This endpoint has been retired. Verify with your access code.' }));

module.exports = router;
