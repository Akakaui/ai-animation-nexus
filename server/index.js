require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');
const applyRoutes = require('./routes/apply');
const paystackRoutes = require('./routes/paystack');
const verifyRoutes = require('./routes/verify');
const adminRoutes = require('./routes/admin');
const { startScheduler } = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

app.use('/api/apply', applyRoutes);
app.use('/api/paystack', paystackRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

initDB();
startScheduler();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Animation Nexus API running on port ${PORT}`);
});
