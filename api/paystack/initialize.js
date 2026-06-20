const { getStudentByEmail } = require('../../lib/db');

module.exports = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const student = await getStudentByEmail(email);
  if (!student) {
    return res.status(404).json({ error: 'Application not found or already paid' });
  }

  const paystackRef = `ANX_${Date.now()}`;

  res.json({
    email,
    amount: 29900,
    reference: paystackRef,
    callback_url: `${process.env.BASE_URL}/confirmation.html`
  });
};
