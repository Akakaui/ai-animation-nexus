require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

const applyRoutes = require('../server/routes/apply');
const paystackRoutes = require('../server/routes/paystack');
const verifyRoutes = require('../server/routes/verify');
const adminRoutes = require('../server/routes/admin');
const contactRoutes = require('../server/routes/contact');

const app = express();

app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use('/api/apply', applyRoutes);
app.use('/api/paystack', paystackRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Serve Static Frontend Files ---
// This makes Express serve all .html, .css, .js files from the project root
app.use(express.static(path.join(__dirname, '..')));

// Catch-all: serve index.html for any unmatched route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// --- Scheduled Reminders (replaces Vercel Cron) ---
// Runs daily at 7:00 PM UTC (8:00 PM WAT) — 1 hour before class
cron.schedule('0 19 * * *', async () => {
  console.log('[Cron] Running daily reminder check...');
  try {
    const { getSessions, getAllStudents, getRemindersSent, markReminderSent } = require('../lib/db');
    const { sendReminderEmail } = require('./services/email');

    const allSessions = await getSessions();
    const todayStr = new Date().toISOString().split('T')[0];
    const session = allSessions.find(s => s.date === todayStr);

    if (!session) {
      console.log('[Cron] No session today, skipping.');
      return;
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
        count++;
      } catch (err) {
        console.error(`[Cron] Failed reminder for ${student.email}:`, err.message);
      }
    }
    console.log(`[Cron] Done. Sent ${count} reminders.`);
  } catch (err) {
    console.error('[Cron] Fatal error:', err.message);
  }
});

// --- Start Server ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AI Animation Nexus running on port ${PORT}`);
});
