const express = require('express');
const router = express.Router();
const db = require('../utils/supabaseClient');
const { authenticate } = require('../middleware/authMiddleware');

// get profile
router.get('/me', authenticate, async (req, res) => {
  res.json(req.user);
});

// update profile
router.put('/me', authenticate, async (req, res) => {
  try {
    const allowed = ['full_name', 'name', 'town', 'phone', 'latitude', 'longitude'];
    const data = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'No valid fields' });
    const updated = await db.update('users', { id: req.user.id }, data);
    res.json(updated[0]);
  } catch (err) {
    console.error('Update profile error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;