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

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await db.findOne('users', { id: userId });
    if (!user) {
      return res.status(404).json({});
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Save user location
router.post('/location', authenticate, async (req, res) => {
  const { latitude, longitude } = req.body;
  try {
    await db.update('users', { id: req.user.id }, { latitude, longitude });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save location' });
  }
});

module.exports = router;