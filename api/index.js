const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

const applyRoutes = require('../server/routes/apply');
const paystackRoutes = require('../server/routes/paystack');
const verifyRoutes = require('../server/routes/verify');
const adminRoutes = require('../server/routes/admin');
const contactRoutes = require('../server/routes/contact');
const { runReminderJob } = require('../lib/reminders');
const { getPublicRuntimeConfig, requireProductionConfig } = require('../lib/config');

const app = express();
try {
  requireProductionConfig();
} catch (error) {
  if (process.env.NODE_ENV === 'production') console.error(`[Config] ${error.message}`);
}

app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(value => value.trim()) : true }));
app.use(express.json({ verify: (req, res, buffer) => { req.rawBody = Buffer.from(buffer); } }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/config', (req, res) => res.json(getPublicRuntimeConfig()));

app.use('/api/apply', applyRoutes);
app.use('/api/paystack', paystackRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

async function runProtectedCron(req, res) {
  const secret = String(process.env.CRON_SECRET || '');
  if (secret && req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'Unauthorized' });
  if (!secret && process.env.NODE_ENV === 'production') return res.status(503).json({ error: 'Cron secret is not configured' });
  try {
    const result = await runReminderJob();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[Cron] Fatal error:', error);
    res.status(500).json({ error: 'Cron failed' });
  }
}
app.post('/api/cron', runProtectedCron);
app.get('/api/cron', runProtectedCron);

app.use(express.static(path.join(__dirname, '..')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));

if (process.env.NODE_ENV !== 'test') {
  cron.schedule('0 19 * * *', async () => {
    try {
      const result = await runReminderJob();
      console.log('[Cron] Reminder result:', JSON.stringify(result));
    } catch (error) {
      console.error('[Cron] Fatal error:', error);
    }
  }, { timezone: 'UTC' });
}

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`AI Animation Nexus running on port ${PORT}`));
}

module.exports = app;
