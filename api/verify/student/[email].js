const { getStudentByEmail, getUnlockedSessions, getDB, isUnlocked } = require('../../../lib/db');

module.exports = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const db = await getDB();

  const student = await getStudentByEmail(email);
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
};
