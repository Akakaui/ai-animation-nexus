// lib/db.js — Vercel KV adapter replacing the JSON file store
// All functions mirror the original server/db.js API exactly.

const { kv } = require('@vercel/kv');

const SESSIONS_KEY = 'nexus:sessions';
const STUDENTS_KEY = 'nexus:students';
const ATTENDANCE_KEY = 'nexus:attendance';
const REMINDERS_KEY = 'nexus:reminders_sent';

const DEFAULT_SESSIONS = [
  { id: 1, session_number: 1, title: 'Photo-to-Video Transformation',         host: 'Bethel',          date: '2026-07-24', zoom_url: null, unlocks_at: '2026-07-24T20:00:00Z' },
  { id: 2, session_number: 2, title: 'Motion-Syncing & Compositing',           host: 'Bethel',          date: '2026-07-25', zoom_url: null, unlocks_at: '2026-07-25T20:00:00Z' },
  { id: 3, session_number: 3, title: 'Maintaining Consistent AI Characters',   host: 'Della',           date: '2026-07-31', zoom_url: null, unlocks_at: '2026-07-31T20:00:00Z' },
  { id: 4, session_number: 4, title: 'Advanced Content Creation Strategy',     host: 'Chijioke',        date: '2026-08-01', zoom_url: null, unlocks_at: '2026-08-01T20:00:00Z' },
  { id: 5, session_number: 5, title: 'AI Automation & Workflow Efficiency',    host: 'Chijioke',        date: '2026-08-07', zoom_url: null, unlocks_at: '2026-08-07T20:00:00Z' },
  { id: 6, session_number: 6, title: 'Think Like a Creative Director',         host: 'Chibuike Ifeoma', date: '2026-08-08', zoom_url: null, unlocks_at: '2026-08-08T20:00:00Z' },
  { id: 7, session_number: 7, title: 'Building Online Presence with AI',       host: 'Chibuike Ifeoma', date: '2026-08-14', zoom_url: null, unlocks_at: '2026-08-14T20:00:00Z' },
  { id: 8, session_number: 8, title: 'Grand Finale & Studio Standards',        host: 'Tochukwu',        date: '2026-08-15', zoom_url: null, unlocks_at: '2026-08-15T20:00:00Z' },
];

function parseUnlockTime(str) {
  if (!str) return null;
  return new Date(str.replace('.000WAT', 'Z'));
}

function isUnlocked(session) {
  if (!session.unlocks_at) return true;
  const t = parseUnlockTime(session.unlocks_at);
  return !t || new Date() >= t;
}

async function saveStudent(student) {
  const students = (await kv.get(STUDENTS_KEY)) || [];
  const idx = students.findIndex(s => s.email === student.email);
  if (idx >= 0) {
    students[idx] = { ...students[idx], ...student };
  } else {
    student.id = Date.now();
    students.push(student);
  }
  await kv.set(STUDENTS_KEY, students);
  return student;
}

async function getStudentByEmail(email) {
  const students = (await kv.get(STUDENTS_KEY)) || [];
  return students.find(s => s.email === email && s.paid) || null;
}

async function getStudentByEmailAny(email) {
  const students = (await kv.get(STUDENTS_KEY)) || [];
  return students.find(s => s.email === email) || null;
}

async function updateStudentByEmail(email, updates) {
  const students = (await kv.get(STUDENTS_KEY)) || [];
  const idx = students.findIndex(s => s.email === email);
  if (idx >= 0) {
    students[idx] = { ...students[idx], ...updates };
    await kv.set(STUDENTS_KEY, students);
    return students[idx];
  }
  return null;
}

async function getAllStudents() {
  return (await kv.get(STUDENTS_KEY)) || [];
}

async function getSessions() {
  const sessions = await kv.get(SESSIONS_KEY);
  if (!sessions) {
    await kv.set(SESSIONS_KEY, DEFAULT_SESSIONS);
    return DEFAULT_SESSIONS;
  }
  return sessions;
}

async function updateSessionZoom(sessionId, zoomUrl) {
  const sessions = await getSessions();
  const s = sessions.find(s => s.id === parseInt(sessionId));
  if (s) { s.zoom_url = zoomUrl; await kv.set(SESSIONS_KEY, sessions); }
  return s;
}

async function updateSessionUnlockTime(sessionId, unlocksAt) {
  const sessions = await getSessions();
  const s = sessions.find(s => s.id === parseInt(sessionId));
  if (s) { s.unlocks_at = unlocksAt; await kv.set(SESSIONS_KEY, sessions); }
  return s;
}

async function getUnlockedSessions() {
  const sessions = await getSessions();
  return sessions.map(s => ({ ...s, zoom_url: isUnlocked(s) ? s.zoom_url : null, is_unlocked: isUnlocked(s) }));
}

async function getSessionById(id) {
  const sessions = await getSessions();
  return sessions.find(s => s.id === parseInt(id)) || null;
}

async function recordAttendance(studentId, sessionId) {
  const attendance = (await kv.get(ATTENDANCE_KEY)) || [];
  const key = `${studentId}-${sessionId}`;
  if (!attendance.find(a => a.key === key)) {
    attendance.push({ key, student_id: studentId, session_id: sessionId, verified_at: new Date().toISOString() });
    await kv.set(ATTENDANCE_KEY, attendance);
  }
}

async function getAttendance() {
  return (await kv.get(ATTENDANCE_KEY)) || [];
}

async function getRemindersSent() {
  return (await kv.get(REMINDERS_KEY)) || [];
}

async function markReminderSent(studentId, sessionId) {
  const reminders = await getRemindersSent();
  reminders.push({ student_id: studentId, session_id: sessionId, sent_at: new Date().toISOString() });
  await kv.set(REMINDERS_KEY, reminders);
}

function generateAccessCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return `AN-${num}-${chars[Math.floor(Math.random() * 26)]}${chars[Math.floor(Math.random() * 26)]}`;
}

module.exports = {
  saveStudent, getStudentByEmail, getStudentByEmailAny, updateStudentByEmail, getAllStudents,
  getSessions, updateSessionZoom, updateSessionUnlockTime, getUnlockedSessions, getSessionById,
  recordAttendance, getAttendance, getRemindersSent, markReminderSent,
  parseUnlockTime, isUnlocked, generateAccessCode,
};
