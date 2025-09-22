const express = require('express');
const router = express.Router();
const db = require('../utils/supabaseClient');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.get('/overview', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const usersCount = (await db.query('SELECT COUNT(*)::int AS count FROM users;')).rows[0].count;
    const rentalsCount = (await db.query('SELECT COUNT(*)::int AS count FROM rentals;')).rows[0].count;
    const messagesCount = (await db.query('SELECT COUNT(*)::int AS count FROM messages;')).rows[0].count;
    res.json({ users: usersCount, rentals: rentalsCount, messages: messagesCount });
  } catch (err) {
    console.error('Stats overview error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;