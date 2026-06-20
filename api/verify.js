const { getStudentByEmail, recordAttendance, getSessionById, isUnlocked, parseUnlockTime, getDB } = require('../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code required' });
  }

  const student = await getStudentByEmail(email);

  if (!student || student.access_code !== code) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const db = await getDB();
  const allSessions = db.sessions;

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
};
