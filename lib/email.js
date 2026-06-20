const WHATSAPP_CHANNEL_LINK = process.env.WHATSAPP_CHANNEL_LINK || 'https://chat.whatsapp.com/YourWhatsAppLinkHere';

let emailClient = null;
let useResend = false;

if (process.env.RESEND_API_KEY) {
  const { Resend } = require('resend');
  emailClient = new Resend(process.env.RESEND_API_KEY);
  useResend = true;
}

async function sendEmail({ to, subject, html }) {
  if (useResend && emailClient) {
    try {
      const data = await emailClient.emails.send({
        from: process.env.EMAIL_FROM || 'AI Animation Nexus <noreply@aianimationnexus.com>',
        to: [to],
        subject,
        html
      });
      console.log('[Email] Sent via Resend:', to, subject);
      return data;
    } catch (err) {
      console.error('[Email] Resend failed:', err.message);
    }
  }

  if (!process.env.SMTP_HOST) {
    console.log('[Email] SMTP not configured. Would send to:', to, '| Subject:', subject);
    return;
  }

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"AI Animation Nexus" <noreply@animationnexus.com>',
    to,
    subject,
    html
  });
}

async function sendConfirmationEmail(email, fullName, accessCode) {
  const firstName = fullName ? fullName.split(' ')[0] : 'there';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #F6F1E7; color: #1A1712; margin: 0; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border: 2px solid #1A1712; border-radius: 4px; padding: 40px; }
    h1 { font-family: Georgia, serif; font-size: 2.5rem; margin-bottom: 20px; }
    .code-box { background: #F6F1E7; border: 2px solid #1A1712; padding: 20px; border-radius: 4px; text-align: center; margin: 24px 0; }
    .code { font-family: monospace; font-size: 2rem; font-weight: bold; letter-spacing: 0.1em; }
    .accent { background: #D4FF3D; color: #1A1712; padding: 2px 8px; font-weight: bold; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px dashed #DAD3C2; font-size: 0.85rem; }
    a { color: #1A1712; }
  </style>
</head>
<body>
  <div class="container">
    <h1>You're Confirmed, ${firstName}.</h1>
    <p>Your seat at AI Animation Nexus is locked in. Here are your details:</p>
    <div class="code-box">
      <p style="margin: 0 0 8px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.7;">Your Access Code</p>
      <p class="code">${accessCode}</p>
    </div>
    <p><strong>Save this code.</strong> You'll use it every class day to get your Zoom link.</p>
    <p>Class days: Fridays & Saturdays, 9–10 PM WAT (UTC+1). Sessions start <strong>July 24</strong>.</p>
    <p>Join the WhatsApp channel for updates:</p>
    <p><a href="${WHATSAPP_CHANNEL_LINK}" class="accent">Join WhatsApp Channel</a></p>
    <p>See you in class.</p>
    <div class="footer">
      <p><strong>AI Animation Nexus</strong></p>
      <p>Dashboard: <a href="${process.env.BASE_URL}/dashboard.html">${process.env.BASE_URL}/dashboard.html</a></p>
    </div>
  </div>
</body>
</html>`;

  await sendEmail({ to: email, subject: "You're In — Your AI Animation Nexus Access Code", html });
}

async function sendReminderEmail(email, fullName, session) {
  const firstName = fullName ? fullName.split(' ')[0] : 'there';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #F6F1E7; color: #1A1712; margin: 0; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border: 2px solid #1A1712; border-radius: 4px; padding: 40px; }
    h1 { font-family: Georgia, serif; font-size: 2rem; margin-bottom: 20px; }
    .session-box { background: #D4FF3D; color: #1A1712; padding: 20px; border-radius: 4px; margin: 24px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px dashed #DAD3C2; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Class in 1 Hour, ${firstName}.</h1>
    <div class="session-box">
      <p style="margin: 0;"><strong>Session ${session.number}: ${session.title}</strong></p>
      <p style="margin: 8px 0 0;">Host: ${session.host} · 9–10 PM WAT</p>
    </div>
    <p>Verify your code to get the Zoom link:</p>
    <p><a href="${process.env.BASE_URL}/dashboard.html">${process.env.BASE_URL}/dashboard.html</a></p>
    <div class="footer">
      <p><strong>AI Animation Nexus</strong></p>
    </div>
  </div>
</body>
</html>`;

  await sendEmail({ to: email, subject: `Reminder: Session ${session.number} Starts in 1 Hour`, html });
}

module.exports = { sendConfirmationEmail, sendReminderEmail };
