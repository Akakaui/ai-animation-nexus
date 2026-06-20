const crypto = require('crypto');
const { getStudentByEmail, updateStudentByEmail } = require('../../lib/db');
const { sendConfirmationEmail } = require('../../lib/email');

function generateAccessCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const c1 = chars[Math.floor(Math.random() * 26)];
  const c2 = chars[Math.floor(Math.random() * 26)];
  return `AN-${num}-${c1}${c2}`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['x-paystack-signature'];
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
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
};
