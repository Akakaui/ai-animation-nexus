const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

router.post('/', async (req, res) => {
  const name = String(req.body && req.body.name || '').trim();
  const email = String(req.body && req.body.email || '').trim().toLowerCase();
  const subject = String(req.body && req.body.subject || 'General Question').trim();
  const message = String(req.body && req.body.message || '').trim();
  if (name.length < 2 || name.length > 120 || !emailPattern.test(email) || message.length < 2 || message.length > 4000) {
    return res.status(400).json({ error: 'Please provide a valid name, email, and message.' });
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(503).json({ error: 'Contact service is temporarily unavailable. Please email support directly.' });
  }

  try {
    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      replyTo: email,
      subject: `[Contact] ${subject} — from ${name}`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#00E599">New Contact Message</h2><p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p><p><strong>Subject:</strong> ${escapeHtml(subject)}</p><div style="margin-top:20px;padding:16px;background:#f5f5f5;border-left:4px solid #00E599;border-radius:4px"><p style="margin:0;white-space:pre-wrap">${escapeHtml(message)}</p></div></div>`,
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Contact email error:', error.message);
    res.status(503).json({ error: 'Unable to send your message right now. Please try again later.' });
  }
});

module.exports = router;
