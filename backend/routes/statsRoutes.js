const express = require('express');
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Basic stats for admin dashboard
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const totalUsers = await db.query('SELECT COUNT(*)::int AS count FROM users;');
    const totalRentals = await db.query('SELECT COUNT(*)::int AS count FROM rentals;');
    const totalMessages = await db.query('SELECT COUNT(*)::int AS count FROM messages;');

    res.json({
      users: totalUsers.rows[0].count,
      rentals: totalRentals.rows[0].count,
      messages: totalMessages.rows[0].count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;