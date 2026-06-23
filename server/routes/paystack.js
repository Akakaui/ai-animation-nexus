const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getStudentByEmail, updateStudentByEmail } = require('../../lib/db');
const { sendConfirmationEmail } = require('../services/email');

function generateAccessCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const c1 = chars[Math.floor(Math.random() * 26)];
  const c2 = chars[Math.floor(Math.random() * 26)];
  return `AN-${num}-${c1}${c2}`;
}

router.post('/webhook', async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== signature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = req.body.event;
  const data = req.body.data;

  if (event === 'charge.success') {
    const customerEmail = data.customer.email;
    const student = await getStudentByEmail(customerEmail);

    if (student && !student.paid) {
      const accessCode = generateAccessCode();
      await updateStudentByEmail(customerEmail, {
        paystack_ref: data.reference,
        access_code: accessCode,
        paid: true
      });

      try {
        await sendConfirmationEmail(student.email, student.full_name, accessCode);
      } catch (emailErr) {
        console.error('Email error:', emailErr);
      }

      return res.json({ success: true, accessCode });
    }
  }

  res.json({ received: true });
});

router.get('/initialize', async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const student = await getStudentByEmail(email);
  if (!student) {
    // If we want to allow unpaid students to initialize
    const { getStudentByEmailAny } = require('../../lib/db');
    const unpaidStudent = await getStudentByEmailAny(email);
    if (!unpaidStudent) {
      return res.status(404).json({ error: 'Application not found' });
    }
    if (unpaidStudent.paid) {
      return res.status(400).json({ error: 'Already paid' });
    }
  }

  const paystackRef = `ANX_${Date.now()}`;
  
  res.json({
    email,
    amount: 29900,
    reference: paystackRef,
    callback_url: `${process.env.BASE_URL}/confirmation.html`
  });
});

module.exports = router;
