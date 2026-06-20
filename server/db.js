const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'nexus.json');

function readDB() {
  if (!fs.existsSync(dbPath)) return initDB();
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function writeDB(data) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function initDB() {
  const data = {
    students: [],
    sessions: [
      { id: 1, session_number: 1, title: 'Photo-to-Video Transformation', host: 'Bethel', date: '2026-07-24', zoom_url: null },
      { id: 2, session_number: 2, title: 'Motion-Syncing & Compositing', host: 'Bethel', date: '2026-07-25', zoom_url: null },
      { id: 3, session_number: 3, title: 'Maintaining Consistent AI Characters', host: 'Della', date: '2026-07-31', zoom_url: null },
      { id: 4, session_number: 4, title: 'Advanced Content Creation Strategy', host: 'Chijioke', date: '2026-08-01', zoom_url: null },
      { id: 5, session_number: 5, title: 'AI Automation & Workflow Efficiency', host: 'Chijioke', date: '2026-08-07', zoom_url: null },
      { id: 6, session_number: 6, title: 'Think Like a Creative Director', host: 'Chibuike Ifeoma', date: '2026-08-08', zoom_url: null },
      { id: 7, session_number: 7, title: 'Building Online Presence with AI', host: 'Chibuike Ifeoma', date: '2026-08-14', zoom_url: null },
      { id: 8, session_number: 8, title: 'Grand Finale & Studio Standards', host: 'Tochukwu', date: '2026-08-15', zoom_url: null }
    ],
    attendance: [],
    reminders_sent: []
  };
  writeDB(data);
  return data;
}

function getDB() {
  return readDB();
}

function saveStudent(student) {
  const db = readDB();
  const existing = db.students.find(s => s.email === student.email);
  if (existing) {
    Object.assign(existing, student);
  } else {
    student.id = db.students.length + 1;
    db.students.push(student);
  }
  writeDB(db);
  return student;
}

function getStudentByEmail(email) {
  const db = readDB();
  return db.students.find(s => s.email === email && s.paid);
}

function updateStudentByEmail(email, updates) {
  const db = readDB();
  const student = db.students.find(s => s.email === email);
  if (student) {
    Object.assign(student, updates);
    writeDB(db);
  }
  return student;
}

function recordAttendance(studentId, sessionId) {
  const db = readDB();
  const key = `${studentId}-${sessionId}`;
  if (!db.attendance.find(a => a.key === key)) {
    db.attendance.push({ key, student_id: studentId, session_id: sessionId, verified_at: new Date().toISOString() });
    writeDB(db);
  }
}

function updateSessionZoom(sessionId, zoomUrl) {
  const db = readDB();
  const session = db.sessions.find(s => s.id === sessionId);
  if (session) {
    session.zoom_url = zoomUrl;
    writeDB(db);
  }
  return session;
}

function getTodaySession() {
  const db = readDB();
  const today = new Date().toISOString().split('T')[0];
  return db.sessions.find(s => s.date === today);
}

module.exports = { initDB, getDB, saveStudent, getStudentByEmail, updateStudentByEmail, recordAttendance, updateSessionZoom, getTodaySession };
