const cron = require('node-cron');
const { getDB } = require('../db');
const { sendReminderEmail } = require('./email');

function startScheduler() {
  cron.schedule('0 * * * *', async () => {
    console.log('Running reminder check...');
    
    const db = getDB();
    const session = db.sessions.find(s => s.date === new Date().toISOString().split('T')[0]);
    if (!session) return;

    const paidStudents = db.students.filter(s => s.paid);
    
    for (const student of paidStudents) {
      const alreadySent = db.reminders_sent.some(
        r => r.student_id === student.id && r.session_id === session.id
      );

      if (alreadySent) continue;

      try {
        await sendReminderEmail(student.email, student.full_name, session);
        
        db.reminders_sent.push({
          student_id: student.id,
          session_id: session.id,
          sent_at: new Date().toISOString()
        });
        
        const fs = require('fs');
        const path = require('path');
        const dbPath = path.join(__dirname, '..', '..', 'data', 'nexus.json');
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        
        console.log(`Reminder sent to ${student.email}`);
      } catch (err) {
        console.error(`Failed to send reminder to ${student.email}:`, err);
      }
    }
  });

  console.log('Reminder scheduler started - checks every hour');
}

module.exports = { startScheduler };
