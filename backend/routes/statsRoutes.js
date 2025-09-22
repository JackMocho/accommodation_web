const express = require('express');
const router = express.Router();
const db = require('../utils/supabaseClient');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.get('/overview', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const totals = {};
    const users = (await db.query('SELECT COUNT(*) AS count FROM users;')).rows[0].count;
    const rentals = (await db.query('SELECT COUNT(*) AS count FROM rentals;')).rows[0].count;
    const messages = (await db.query('SELECT COUNT(*) AS count FROM messages;')).rows[0].count;
    totals.users = parseInt(users, 10);
    totals.rentals = parseInt(rentals, 10);
    totals.messages = parseInt(messages, 10);
    res.json(totals);
  } catch (err) {
    console.error('Stats overview error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;