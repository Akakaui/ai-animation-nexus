require('dotenv').config();

async function sendViaResend({ to, subject, html }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'AI Animation Nexus <noreply@example.com>',
      to: [to],
      subject,
      html,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || payload.name || `Resend delivery failed (${response.status})`);
  }
  console.log('[Email] Sent via Resend:', to, subject);
  return payload;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function baseUrl() {
  return String(process.env.BASE_URL || '').replace(/\/$/, '');
}

async function sendEmail({ to, subject, html }) {
  if (process.env.RESEND_API_KEY) {
    return sendViaResend({ to, subject, html });
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    console.log('[Email] Sent via SMTP:', to, subject);
    return result;
  }

  if (process.env.NODE_ENV === 'production') throw new Error('No email provider is configured');
  console.warn('[Email] No provider configured; development dry-run for:', to, subject);
  return { dryRun: true };
}

function emailShell(content) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;background:#F6F1E7;color:#1A1712;margin:0;padding:40px 20px}.container{max-width:600px;margin:0 auto;background:#fff;border:2px solid #1A1712;border-radius:4px;padding:40px}h1{font-family:Georgia,serif;font-size:2.5rem;margin-bottom:20px}.code-box{background:#F6F1E7;border:2px solid #1A1712;padding:20px;border-radius:4px;text-align:center;margin:24px 0}.code{font-family:monospace;font-size:2rem;font-weight:bold;letter-spacing:.1em}.accent{background:#D4FF3D;color:#1A1712;padding:2px 8px;font-weight:bold}.session-box{background:#D4FF3D;color:#1A1712;padding:20px;border-radius:4px;margin:24px 0}.footer{margin-top:40px;padding-top:20px;border-top:1px dashed #DAD3C2;font-size:.85rem}a{color:#1A1712}
</style></head><body><div class="container">${content}</div></body></html>`;
}

async function sendConfirmationEmail(email, fullName, accessCode) {
  const firstName = escapeHtml(fullName ? fullName.split(' ')[0] : 'there');
  const whatsapp = process.env.WHATSAPP_CHANNEL_LINK ? `<p><a href="${escapeHtml(process.env.WHATSAPP_CHANNEL_LINK)}" class="accent">Join WhatsApp Channel</a></p>` : '';
  const dashboard = `${baseUrl()}/dashboard.html`;
  const html = emailShell(`
    <h1>You're Confirmed, ${firstName}.</h1>
    <p>Your seat at AI Animation Nexus is locked in. Here are your details:</p>
    <div class="code-box"><p style="margin:0 0 8px;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.7">Your Access Code</p><p class="code">${escapeHtml(accessCode)}</p></div>
    <p><strong>Save this code.</strong> You'll use it on class days to get your Zoom link.</p>
    <p>Class sessions run at the published schedule and unlock at the configured session time.</p>
    ${whatsapp}
    <p>Dashboard: <a href="${escapeHtml(dashboard)}">${escapeHtml(dashboard)}</a></p>
    <p>See you in class.</p><div class="footer"><p><strong>AI Animation Nexus</strong></p></div>`);
  return sendEmail({ to: email, subject: "You're In — Your AI Animation Nexus Access Code", html });
}

async function sendReminderEmail(email, fullName, session) {
  const firstName = escapeHtml(fullName ? fullName.split(' ')[0] : 'there');
  const dashboard = `${baseUrl()}/dashboard.html`;
  const html = emailShell(`
    <h1>Class in 1 Hour, ${firstName}.</h1>
    <div class="session-box"><p style="margin:0"><strong>Session ${escapeHtml(session.session_number || session.number)}: ${escapeHtml(session.title)}</strong></p><p style="margin:8px 0 0">Host: ${escapeHtml(session.host)}</p></div>
    <p>Verify your access code to get the Zoom link:</p><p><a href="${escapeHtml(dashboard)}">${escapeHtml(dashboard)}</a></p>
    <div class="footer"><p><strong>AI Animation Nexus</strong></p></div>`);
  return sendEmail({ to: email, subject: `Reminder: Session ${session.session_number || session.number} Starts in 1 Hour`, html });
}

module.exports = { sendConfirmationEmail, sendReminderEmail, sendEmail };
