const { getSessions, getAllStudents, getRemindersSent, markReminderSent } = require('../../lib/db');
const { sendReminderEmail } = require('../services/email');

module.exports = async function handler(req, res) {
  // Optional: secure the cron job so only Vercel can trigger it
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const allSessions = await getSessions();
    const todayStr = new Date().toISOString().split('T')[0];
    const session = allSessions.find(s => s.date === todayStr);

    if (!session) {
      return res.json({ success: true, message: 'No session today' });
    }

    const allStudents = await getAllStudents();
    const paidStudents = allStudents.filter(s => s.paid);
    const remindersSent = await getRemindersSent();

    let count = 0;
    for (const student of paidStudents) {
      const alreadySent = remindersSent.some(
        r => r.student_id === student.id && r.session_id === session.id
      );

      if (alreadySent) continue;

      try {
        await sendReminderEmail(student.email, student.full_name, session);
        await markReminderSent(student.id, session.id);
        console.log(`Reminder sent to ${student.email}`);
        count++;
      } catch (err) {
        console.error(`Failed to send reminder to ${student.email}:`, err);
      }
    }

    res.json({ success: true, sent: count });
  } catch (error) {
    console.error('Cron error:', error);
    res.status(500).json({ error: 'Cron failed' });
  }
}
