const express = require('express');
const cors = require('cors');

const applyRoutes = require('../server/routes/apply');
const paystackRoutes = require('../server/routes/paystack');
const verifyRoutes = require('../server/routes/verify');
const adminRoutes = require('../server/routes/admin');
const contactRoutes = require('../server/routes/contact');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/apply', applyRoutes);
app.use('/api/paystack', paystackRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Animation Nexus API running locally on port ${PORT}`));
}

module.exports = app;
