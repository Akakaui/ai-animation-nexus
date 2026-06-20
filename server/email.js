const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] RESEND_API_KEY not set. Would send to:', to, 'Subject:', subject);
    return { success: false, error: 'No API key' };
  }

  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'AI Animation Nexus <noreply@animationnexus.com>',
      to: [to],
      subject,
      html
    });
    return { success: true, data };
  } catch (err) {
    console.error('[Email] Send failed:', err);
    return { success: false, error: err.message };
  }
}

async function sendConfirmation(email, student, accessCode) {
  return sendEmail({
    to: email,
    subject: 'You\'re in — AI Animation Nexus',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #111;">AI Animation Nexus</h1>
        <p>Hi ${student.full_name || 'there'},</p>
        <p>Your application has been confirmed. Here are your details:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Access Code:</strong> <span style="font-size: 1.2em; font-weight: bold;">${accessCode}</span></p>
          <p style="margin: 0;">Keep this code safe — you'll need it to access your live sessions.</p>
        </div>
        <p>Sessions start July 24, 2026 at 9 PM WAT (Fridays & Saturdays).</p>
        <p>You'll receive the Zoom link for each session on the dashboard when it's time.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 0.9em;">AI Animation Nexus — 8-session live course</p>
      </div>
    `
  });
}

async function sendReminder(email, student, session) {
  return sendEmail({
    to: email,
    subject: `Reminder: ${session.title} is tonight at 9 PM WAT`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #111;">AI Animation Nexus — Session Reminder</h1>
        <p>Hi ${student.full_name || 'there'},</p>
        <p>This is a reminder that <strong>${session.title}</strong> is happening tonight.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Session ${session.session_number}:</strong> ${session.title}</p>
          <p style="margin: 0 0 8px;"><strong>Host:</strong> ${session.host}</p>
          <p style="margin: 0;"><strong>Time:</strong> 9:00 PM WAT (8:00 PM UTC)</p>
        </div>
        <p>Go to your dashboard and verify your access code to get the Zoom link.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 0.9em;">AI Animation Nexus</p>
      </div>
    `
  });
}

module.exports = { sendEmail, sendConfirmation, sendReminder };