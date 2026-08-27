require('dotenv').config();
const crypto = require('crypto');
const { Redis } = require('@upstash/redis');

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

let kv;
if (REDIS_URL && REDIS_TOKEN) {
  kv = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
} else {
  console.warn('[DB] No Redis credentials found — using in-memory store (local development only).');
  const store = Object.create(null);
  kv = {
    get: async key => store[key] ?? null,
    set: async (key, value) => { store[key] = value; return 'OK'; },
  };
}

const SESSIONS_KEY = 'nexus:sessions';
const STUDENTS_KEY = 'nexus:students';
const ATTENDANCE_KEY = 'nexus:attendance';
const REMINDERS_KEY = 'nexus:reminders_sent';
const WEBHOOKS_KEY = 'nexus:paystack_webhooks';

const DEFAULT_SESSIONS = [
  { id: 1, session_number: 1, title: 'Photo-to-Video Transformation', host: 'Augustus Akuwuike', date: '2026-07-24', zoom_url: null, unlocks_at: '2026-07-24T20:00:00Z' },
  { id: 2, session_number: 2, title: 'Motion-Syncing & Compositing', host: 'Augustus Akuwuike', date: '2026-07-25', zoom_url: null, unlocks_at: '2026-07-25T20:00:00Z' },
  { id: 3, session_number: 3, title: 'Maintaining Consistent AI Characters', host: 'Bethel Okaibedi', date: '2026-07-31', zoom_url: null, unlocks_at: '2026-07-31T20:00:00Z' },
  { id: 4, session_number: 4, title: 'Advanced Content Creation Strategy', host: 'Chijioke', date: '2026-08-01', zoom_url: null, unlocks_at: '2026-08-01T20:00:00Z' },
  { id: 5, session_number: 5, title: 'AI Automation & Workflow Efficiency', host: 'Chijioke', date: '2026-08-07', zoom_url: null, unlocks_at: '2026-08-07T20:00:00Z' },
  { id: 6, session_number: 6, title: 'Think Like a Creative Director', host: 'Chibuike Ifeoma', date: '2026-08-08', zoom_url: null, unlocks_at: '2026-08-08T20:00:00Z' },
  { id: 7, session_number: 7, title: 'Building Online Presence with AI', host: 'Chibuike Ifeoma', date: '2026-08-14', zoom_url: null, unlocks_at: '2026-08-14T20:00:00Z' },
  { id: 8, session_number: 8, title: 'Grand Finale & Studio Standards', host: 'Tochukwu', date: '2026-08-15', zoom_url: null, unlocks_at: '2026-08-15T20:00:00Z' },
];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isActiveStudent(student) {
  return Boolean(student && (student.paid || student.payment_status === 'free' || student.payment_status === 'paid'));
}

function parseUnlockTime(value) {
  if (!value) return null;
  const normalized = String(value).replace('.000WAT', 'Z');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isUnlocked(session, now = new Date()) {
  const unlock = parseUnlockTime(session && session.unlocks_at);
  return !unlock || now >= unlock;
}

async function readArray(key) {
  const value = await kv.get(key);
  return Array.isArray(value) ? value : [];
}

async function writeArray(key, value) {
  await kv.set(key, value);
  return value;
}

function sanitizeStudent(student) {
  return {
    id: student.id,
    full_name: student.full_name,
    email: student.email,
    whatsapp: student.whatsapp || null,
    goals: student.goals || null,
    portfolio: student.portfolio || null,
    referral: student.referral || null,
    paid: Boolean(student.paid),
    payment_status: student.payment_status || (student.paid ? 'paid' : 'pending'),
    access_code: student.access_code || null,
    paystack_ref: student.paystack_ref || null,
    created_at: student.created_at,
    paid_at: student.paid_at || null,
  };
}

async function saveStudent(input) {
  const students = await readArray(STUDENTS_KEY);
  const email = normalizeEmail(input.email);
  const existingIndex = students.findIndex(student => normalizeEmail(student.email) === email);
  const student = {
    ...(existingIndex >= 0 ? students[existingIndex] : {}),
    ...input,
    email,
    full_name: String(input.full_name || '').trim(),
    id: existingIndex >= 0 ? students[existingIndex].id : crypto.randomUUID(),
    created_at: existingIndex >= 0 ? students[existingIndex].created_at : (input.created_at || new Date().toISOString()),
  };
  if (existingIndex >= 0) students[existingIndex] = student;
  else students.push(student);
  await writeArray(STUDENTS_KEY, students);
  return sanitizeStudent(student);
}

async function getStudentByEmail(email) {
  const normalized = normalizeEmail(email);
  return (await readArray(STUDENTS_KEY)).find(student => normalizeEmail(student.email) === normalized && isActiveStudent(student)) || null;
}

async function getStudentByEmailAny(email) {
  const normalized = normalizeEmail(email);
  return (await readArray(STUDENTS_KEY)).find(student => normalizeEmail(student.email) === normalized) || null;
}

async function getStudentByAccessCode(accessCode) {
  const normalized = String(accessCode || '').trim().toUpperCase();
  return (await readArray(STUDENTS_KEY)).find(student => isActiveStudent(student) && student.access_code === normalized) || null;
}

async function updateStudentByEmail(email, updates) {
  const students = await readArray(STUDENTS_KEY);
  const normalized = normalizeEmail(email);
  const index = students.findIndex(student => normalizeEmail(student.email) === normalized);
  if (index < 0) return null;
  students[index] = { ...students[index], ...updates, email: normalized };
  await writeArray(STUDENTS_KEY, students);
  return students[index];
}

async function getAllStudents() {
  return readArray(STUDENTS_KEY);
}

async function getSessions() {
  const sessions = await kv.get(SESSIONS_KEY);
  if (!Array.isArray(sessions) || !sessions.length) {
    await kv.set(SESSIONS_KEY, DEFAULT_SESSIONS);
    return DEFAULT_SESSIONS;
  }
  return sessions;
}

async function updateSessionZoom(sessionId, zoomUrl) {
  const sessions = await getSessions();
  const session = sessions.find(item => item.id === Number(sessionId));
  if (session) {
    session.zoom_url = zoomUrl || null;
    await writeArray(SESSIONS_KEY, sessions);
  }
  return session || null;
}

async function updateSessionUnlockTime(sessionId, unlocksAt) {
  const sessions = await getSessions();
  const session = sessions.find(item => item.id === Number(sessionId));
  if (session) {
    const parsed = parseUnlockTime(unlocksAt);
    if (!parsed) throw new Error('Invalid unlock time');
    session.unlocks_at = parsed.toISOString();
    session.date = parsed.toISOString().slice(0, 10);
    await writeArray(SESSIONS_KEY, sessions);
  }
  return session || null;
}

function publicSession(session, now = new Date()) {
  return {
    id: session.id,
    session_number: session.session_number,
    title: session.title,
    host: session.host,
    date: session.date,
    unlocks_at: session.unlocks_at,
    is_unlocked: isUnlocked(session, now),
  };
}

async function getUnlockedSessions(now = new Date()) {
  return (await getSessions()).map(session => ({
    ...publicSession(session, now),
    zoom_url: isUnlocked(session, now) ? session.zoom_url : null,
  }));
}

async function getSessionById(id) {
  return (await getSessions()).find(session => session.id === Number(id)) || null;
}

async function recordAttendance(studentId, sessionId) {
  const attendance = await readArray(ATTENDANCE_KEY);
  const key = `${studentId}-${sessionId}`;
  if (!attendance.some(record => record.key === key)) {
    attendance.push({ key, student_id: studentId, session_id: Number(sessionId), verified_at: new Date().toISOString() });
    await writeArray(ATTENDANCE_KEY, attendance);
  }
}

async function getAttendance() {
  return readArray(ATTENDANCE_KEY);
}

async function getRemindersSent() {
  return readArray(REMINDERS_KEY);
}

async function markReminderSent(studentId, sessionId) {
  const reminders = await readArray(REMINDERS_KEY);
  if (!reminders.some(record => record.student_id === studentId && record.session_id === Number(sessionId))) {
    reminders.push({ student_id: studentId, session_id: Number(sessionId), sent_at: new Date().toISOString() });
    await writeArray(REMINDERS_KEY, reminders);
  }
}

async function hasProcessedWebhook(reference) {
  return (await readArray(WEBHOOKS_KEY)).some(item => item.reference === reference);
}

async function markWebhookProcessed(reference, event) {
  const hooks = await readArray(WEBHOOKS_KEY);
  if (!hooks.some(item => item.reference === reference)) {
    hooks.push({ reference, event, processed_at: new Date().toISOString() });
    await writeArray(WEBHOOKS_KEY, hooks);
  }
}

function generateAccessCode() {
  return `AN-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

async function generateUniqueAccessCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateAccessCode();
    if (!(await getStudentByAccessCode(code))) return code;
  }
  throw new Error('Could not generate a unique access code');
}

module.exports = {
  saveStudent,
  getStudentByEmail,
  getStudentByEmailAny,
  getStudentByAccessCode,
  updateStudentByEmail,
  getAllStudents,
  getSessions,
  updateSessionZoom,
  updateSessionUnlockTime,
  getUnlockedSessions,
  getSessionById,
  recordAttendance,
  getAttendance,
  getRemindersSent,
  markReminderSent,
  hasProcessedWebhook,
  markWebhookProcessed,
  parseUnlockTime,
  isUnlocked,
  generateAccessCode,
  generateUniqueAccessCode,
  normalizeEmail,
  isActiveStudent,
  publicSession,
  sanitizeStudent,
};
