const { getSessions, getAllStudents, getRemindersSent, markReminderSent, isActiveStudent } = require('./db');
const { sendReminderEmail } = require('../server/services/email');

async function runReminderJob(now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const sessions = await getSessions();
  const session = sessions.find(item => item.date === today);
  if (!session) return { sent: 0, skipped: 0, message: 'No session today' };

  const students = (await getAllStudents()).filter(isActiveStudent);
  const sentRecords = await getRemindersSent();
  let sent = 0;
  let skipped = 0;
  const errors = [];

  for (const student of students) {
    if (sentRecords.some(record => record.student_id === student.id && record.session_id === session.id)) {
      skipped += 1;
      continue;
    }
    try {
      await sendReminderEmail(student.email, student.full_name, session);
      await markReminderSent(student.id, session.id);
      sent += 1;
    } catch (error) {
      errors.push({ email: student.email, message: error.message });
      console.error(`[Reminder] Failed for ${student.email}:`, error.message);
    }
  }
  return { sent, skipped, errors, session: session.session_number };
}

module.exports = { runReminderJob };
