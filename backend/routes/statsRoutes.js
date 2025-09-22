const express = require('express');
const router = express.Router();
const db = require('../utils/supabaseClient');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.get('/overview', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const usersRow = (await db.query('SELECT COUNT(*)::int AS count FROM users')).rows[0];
    const rentalsRow = (await db.query('SELECT COUNT(*)::int AS count FROM rentals')).rows[0];
    res.json({ users: usersRow?.count ?? 0, rentals: rentalsRow?.count ?? 0 });
  } catch (err) {
    console.error('Stats overview error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/counts', async (req, res) => {
  try {
    const usersRow = (await db.query('SELECT COUNT(*)::int AS count FROM users')).rows[0];
    const rentalsRow = (await db.query('SELECT COUNT(*)::int AS count FROM rentals')).rows[0];
    const users = usersRow ? usersRow.count : 0;
    const rentals = rentalsRow ? rentalsRow.count : 0;
    res.json({ users, rentals });
  } catch (err) {
    console.error('Stats counts error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;