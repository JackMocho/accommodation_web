const express = require('express');
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  res.json(req.user);
});

// Update profile
router.put('/me', authenticate, async (req, res) => {
  try {
    const updates = req.body;
    const updated = await db.update('users', { id: req.user.id }, updates, '*');
    res.json(updated[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// Admin: list users
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const users = await db.findBy('users', {}, 'id,email,name,role,suspended');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;