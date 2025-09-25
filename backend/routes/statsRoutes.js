const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/counts', async (req, res) => {
  try {
    const users = (await db.query('SELECT COUNT(*)::int AS count FROM users;')).rows[0].count;
    const rentals = (await db.query('SELECT COUNT(*)::int AS count FROM rentals;')).rows[0].count;
    const activeRentals = (await db.query("SELECT COUNT(*)::int AS count FROM rentals WHERE status='active';")).rows[0].count;
    res.json({ users, rentals, activeRentals });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;