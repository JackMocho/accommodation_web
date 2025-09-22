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
    // allow these fields to be updated; role is sensitive and only allowed by admin
    const allowed = ['full_name', 'name', 'town', 'phone', 'latitude', 'longitude', 'role'];
    const data = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });

    // prevent non-admins from changing their role
    if ('role' in data && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can change role' });
    }

    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'No valid fields' });
    const updated = await db.update('users', { id: req.user.id }, data);
    // remove sensitive fields before returning
    const safe = { ...updated[0] };
    delete safe.password;
    res.json(safe);
  } catch (err) {
    console.error('Update profile error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;