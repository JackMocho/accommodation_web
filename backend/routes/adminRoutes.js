const express = require('express');
const router = express.Router();
const db = require('../utils/supabaseClient');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate, requireRole('admin'));

// list users
router.get('/users', async (req, res) => {
  try {
    const rows = (await db.query('SELECT id, email, full_name, role, approved, suspended, created_at FROM users ORDER BY created_at DESC;')).rows;
    res.json(rows);
  } catch (err) {
    console.error('Admin list users error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// approve user
router.post('/users/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.update('users', { id }, { approved: true });
    res.json(updated[0]);
  } catch (err) {
    console.error('Approve user error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// suspend user
router.post('/users/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const { suspended = true } = req.body;
    const updated = await db.update('users', { id }, { suspended });
    res.json(updated[0]);
  } catch (err) {
    console.error('Suspend user error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;