const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { getStudentByEmailAny, updateStudentByEmail, generateUniqueAccessCode, hasProcessedWebhook, markWebhookProcessed } = require('../../lib/db');
const { getPaymentWindowStatus } = require('../../lib/config');
const { sendConfirmationEmail } = require('../services/email');

function isValidSignature(req) {
  const signature = String(req.headers['x-paystack-signature'] || '');
  const secret = String(process.env.PAYSTACK_SECRET_KEY || '');
  if (!signature || !secret) return false;
  const body = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
  const expected = crypto.createHmac('sha512', secret).update(body).digest('hex');
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

router.post('/webhook', async (req, res) => {
  if (!isValidSignature(req)) return res.status(400).json({ error: 'Invalid signature' });
  const event = req.body || {};
  const reference = String(event.data && event.data.reference || '').trim();
  if (!event.event || !reference) return res.status(400).json({ error: 'Invalid webhook payload' });
  if (await hasProcessedWebhook(reference)) return res.json({ received: true, duplicate: true });
  if (event.event !== 'charge.success') return res.json({ received: true });

  const customerEmail = String(event.data.customer && event.data.customer.email || '').trim().toLowerCase();
  if (!customerEmail) return res.status(400).json({ error: 'Missing customer email' });
  const student = await getStudentByEmailAny(customerEmail);
  if (!student) return res.status(202).json({ received: true, message: 'Applicant not found; event will not be retried.' });

  try {
    const accessCode = student.access_code || await generateUniqueAccessCode();
    const updated = await updateStudentByEmail(customerEmail, {
      paid: true,
      payment_status: 'paid',
      paystack_ref: reference,
      access_code: accessCode,
      paid_at: student.paid_at || new Date().toISOString(),
    });
    await sendConfirmationEmail(updated.email, updated.full_name, accessCode);
    await markWebhookProcessed(reference, event.event);
    return res.json({ success: true, received: true });
  } catch (error) {
    console.error('Paystack fulfillment error:', error);
    return res.status(500).json({ error: 'Payment received but fulfillment is pending retry.' });
  }
});

router.get('/initialize', async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email required' });
  const payment = getPaymentWindowStatus();
  if (!payment.isPaid) return res.status(payment.isClosed ? 403 : 409).json({ error: payment.isClosed ? 'Applications are closed.' : 'Payments are currently paused.' });
  const student = await getStudentByEmailAny(email);
  if (!student) return res.status(404).json({ error: 'Application not found' });
  if (student.paid || student.payment_status === 'paid') return res.status(409).json({ error: 'Already paid' });
  const reference = `ANX_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  res.json({
    email,
    amount: payment.config.amountMinor,
    currency: payment.config.currency,
    reference,
    callback_url: `${String(process.env.BASE_URL || '').replace(/\/$/, '')}/confirmation.html`,
  });
});

router.get('/status', async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  const reference = String(req.query.reference || '').trim();
  if (!email || !reference) return res.status(400).json({ error: 'Email and reference required' });
  const student = await getStudentByEmailAny(email);
  const paid = Boolean(student && student.paid && student.paystack_ref === reference);
  res.json({ paid, paymentStatus: student ? (student.payment_status || (student.paid ? 'paid' : 'pending')) : 'unknown' });
});

module.exports = router;
