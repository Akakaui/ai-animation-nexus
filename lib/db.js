const { kv } = require('@vercel/kv');

const KV_KEY = 'nexus_db';

const DEFAULT_SESSIONS = [
  { id: 1, session_number: 1, title: 'Photo-to-Video Transformation', host: 'Bethel', date: '2026-07-24', zoom_url: null, unlocks_at: '2026-07-24T20:00:00.000WAT' },
  { id: 2, session_number: 2, title: 'Motion-Syncing & Compositing', host: 'Bethel', date: '2026-07-25', zoom_url: null, unlocks_at: '2026-07-25T20:00:00.000WAT' },
  { id: 3, session_number: 3, title: 'Maintaining Consistent AI Characters', host: 'Della', date: '2026-07-31', zoom_url: null, unlocks_at: '2026-07-31T20:00:00.000WAT' },
  { id: 4, session_number: 4, title: 'Advanced Content Creation Strategy', host: 'Chijioke', date: '2026-08-01', zoom_url: null, unlocks_at: '2026-08-01T20:00:00.000WAT' },
  { id: 5, session_number: 5, title: 'AI Automation & Workflow Efficiency', host: 'Chijioke', date: '2026-08-07', zoom_url: null, unlocks_at: '2026-08-07T20:00:00.000WAT' },
  { id: 6, session_number: 6, title: 'Think Like a Creative Director', host: 'Chibuike Ifeoma', date: '2026-08-08', zoom_url: null, unlocks_at: '2026-08-08T20:00:00.000WAT' },
  { id: 7, session_number: 7, title: 'Building Online Presence with AI', host: 'Chibuike Ifeoma', date: '2026-08-14', zoom_url: null, unlocks_at: '2026-08-14T20:00:00.000WAT' },
  { id: 8, session_number: 8, title: 'Grand Finale & Studio Standards', host: 'Tochukwu', date: '2026-08-15', zoom_url: null, unlocks_at: '2026-08-15T20:00:00.000WAT' }
];

const INITIAL_DB = {
  students: [],
  sessions: DEFAULT_SESSIONS,
  attendance: [],
  reminders_sent: []
};

async function getDB() {
  try {
    const data = await kv.get(KV_KEY);
    if (data) return data;
  } catch (e) {
    console.error('[DB] KV read error:', e.message);
  }
  return { ...INITIAL_DB, sessions: [...DEFAULT_SESSIONS.map(s => ({ ...s }))] };
}

async function writeDB(data) {
  await kv.set(KV_KEY, data);
}

async function saveStudent(student) {
  const db = await getDB();
  const existing = db.students.find(s => s.email === student.email);
  if (existing) {
    Object.assign(existing, student);
  } else {
    student.id = db.students.length + 1;
    db.students.push(student);
  }
  await writeDB(db);
  return student;
}

async function getStudentByEmail(email) {
  const db = await getDB();
  return db.students.find(s => s.email === email && s.paid);
}

async function updateStudentByEmail(email, updates) {
  const db = await getDB();
  const student = db.students.find(s => s.email === email);
  if (student) {
    Object.assign(student, updates);
    await writeDB(db);
  }
  return student;
}

async function recordAttendance(studentId, sessionId) {
  const db = await getDB();
  const key = `${studentId}-${sessionId}`;
  if (!db.attendance.find(a => a.key === key)) {
    db.attendance.push({ key, student_id: studentId, session_id: sessionId, verified_at: new Date().toISOString() });
    await writeDB(db);
  }
}

async function updateSessionZoom(sessionId, zoomUrl) {
  const db = await getDB();
  const session = db.sessions.find(s => s.id === sessionId);
  if (session) {
    session.zoom_url = zoomUrl;
    await writeDB(db);
  }
  return session;
}

async function updateSessionUnlockTime(sessionId, unlocksAt) {
  const db = await getDB();
  const session = db.sessions.find(s => s.id === sessionId);
  if (session) {
    session.unlocks_at = unlocksAt;
    await writeDB(db);
  }
  return session;
}

function parseUnlockTime(unlocksAtStr) {
  if (!unlocksAtStr) return null;
  const clean = unlocksAtStr.replace('.000WAT', '');
  const [datePart, timePart] = clean.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour = 20, minute = 0] = (timePart || '20:00').split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
}

function isUnlocked(session) {
  if (!session.unlocks_at) return true;
  const unlockTime = parseUnlockTime(session.unlocks_at);
  if (!unlockTime) return true;
  return new Date() >= unlockTime;
}

async function getTodaySession() {
  const db = await getDB();
  const today = new Date().toISOString().split('T')[0];
  return db.sessions.find(s => s.date === today);
}

async function getSessionById(id) {
  const db = await getDB();
  return db.sessions.find(s => s.id === parseInt(id));
}

async function getUnlockedSessions() {
  const db = await getDB();
  return db.sessions.map(s => {
    const unlocked = isUnlocked(s);
    return { ...s, zoom_url: unlocked ? s.zoom_url : null, is_unlocked: unlocked };
  });
}

async function getCurrentAndNextSessions() {
  const db = await getDB();
  const now = new Date();
  const sorted = [...db.sessions].sort((a, b) => {
    const aTime = parseUnlockTime(a.unlocks_at) || new Date(2099, 0, 1);
    const bTime = parseUnlockTime(b.unlocks_at) || new Date(2099, 0, 1);
    return aTime - bTime;
  });

  const result = [];
  for (const session of sorted) {
    if (result.length >= 2) break;
    const sessionTime = parseUnlockTime(session.unlocks_at);
    if (sessionTime && sessionTime > now && result.length === 0) {
      result.push(session);
    }
    if (result.length === 0 && sessionTime && sessionTime <= now) {
      result.push(session);
    } else if (result.length === 1 && sessionTime && sessionTime > now) {
      result.push(session);
    }
  }

  return result.map(s => ({
    ...s,
    zoom_url: isUnlocked(s) ? s.zoom_url : null,
    is_unlocked: isUnlocked(s)
  }));
}

module.exports = {
  getDB, saveStudent, getStudentByEmail, updateStudentByEmail,
  recordAttendance, updateSessionZoom, updateSessionUnlockTime,
  getTodaySession, getSessionById, getUnlockedSessions, getCurrentAndNextSessions,
  parseUnlockTime, isUnlocked
};
