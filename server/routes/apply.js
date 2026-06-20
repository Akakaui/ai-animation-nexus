const express = require('express');
const router = express.Router();
const { saveStudent } = require('../db');

router.post('/', (req, res) => {
  const { fullName, email, whatsapp, goals, portfolio, referral } = req.body;

  if (!fullName || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const student = saveStudent({
      full_name: fullName,
      email,
      whatsapp: whatsapp || null,
      goals: goals || null,
      portfolio: portfolio || null,
      referral: referral || null,
      paid: false,
      created_at: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      studentId: student.id,
      message: 'Application saved. Proceed to payment.'
    });
  } catch (err) {
    console.error('Apply error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
