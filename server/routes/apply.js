const express = require('express');
const router = express.Router();
const { saveStudent, getStudentByEmailAny, generateUniqueAccessCode } = require('../../lib/db');
const { getPaymentWindowStatus } = require('../../lib/config');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', async (req, res) => {
  const body = req.body || {};
  const fullName = String(body.fullName || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const whatsapp = String(body.whatsapp || '').trim();
  const goals = String(body.goals || '').trim();
  const portfolio = String(body.portfolio || '').trim();
  const referral = String(body.referral || '').trim();

  if (fullName.length < 2 || fullName.length > 120) return res.status(400).json({ error: 'Please enter your full name.' });
  if (!emailPattern.test(email) || email.length > 254) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (whatsapp.length > 40 || goals.length > 2000 || portfolio.length > 500 || referral.length > 80) return res.status(400).json({ error: 'One or more fields are too long.' });
  if (portfolio) {
    try {
      const url = new URL(portfolio);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid');
    } catch (_) {
      return res.status(400).json({ error: 'Portfolio URL must be a valid HTTP or HTTPS URL.' });
    }
  }

  try {
    const payment = getPaymentWindowStatus();
    const existing = await getStudentByEmailAny(email);
    const isActive = existing && (existing.paid || existing.payment_status === 'free' || existing.payment_status === 'paid');
    const updates = {
      full_name: fullName,
      email,
      whatsapp: whatsapp || null,
      goals: goals || null,
      portfolio: portfolio || null,
      referral: referral || null,
      paid: false,
      payment_status: payment.isFree ? 'free' : payment.isPaid ? 'pending' : 'closed',
    };

    if (payment.isClosed) return res.status(403).json({ error: 'Applications are currently closed.' });
    if (isActive) return res.status(409).json({ error: 'This email is already enrolled. Please use the student dashboard.' });

    if (payment.isFree) {
      updates.paid = false;
      updates.payment_status = 'free';
      updates.access_code = await generateUniqueAccessCode();
      updates.paid_at = new Date().toISOString();
    }

    const student = await saveStudent(updates);
    res.json({
      success: true,
      studentId: student.id,
      paymentRequired: payment.isPaid,
      paymentStatus: payment.mode,
      accessCode: payment.isFree ? student.access_code : null,
      message: payment.isFree ? 'Application accepted. Your access code is ready.' : 'Application saved. Proceed to payment.',
    });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ error: 'Unable to save your application right now.' });
  }
});

module.exports = router;
