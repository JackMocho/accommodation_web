const express = require('express');
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// List users (PROTECT THIS ROUTE)
router.get('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const rows = (await db.query('SELECT id, email, full_name, role, approved, suspended, created_at FROM users ORDER BY created_at DESC;')).rows;
    res.json(rows);
  } catch (err) {
    console.error('Admin list users error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve user (set approved=true, suspended=false)
router.post('/users/:id/approve', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.query(
      'UPDATE users SET approved=true, suspended=false WHERE id=$1 RETURNING *;',
      [id]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    console.error('Approve user error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Suspend user (set suspended=true, approved=false)
router.post('/users/:id/suspend', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    const updated = await db.query(
      'UPDATE users SET suspended=true, approved=false WHERE id=$1 RETURNING *;',
      [userId]
    );
    res.json(updated.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await db.query('DELETE FROM users WHERE id=$1 RETURNING *;', [req.params.id]);
    res.json(deleted.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all rentals
router.get('/rentals', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const rentals = (await db.query('SELECT * FROM rentals')).rows;
    res.json(rentals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rentals' });
  }
});

// Get system stats
router.get('/stats', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const totalUsers = (await db.query('SELECT COUNT(*)::int AS count FROM users;')).rows[0].count;
    const totalRentals = (await db.query('SELECT COUNT(*)::int AS count FROM rentals;')).rows[0].count;
    const activeRentals = (await db.query("SELECT COUNT(*)::int AS count FROM rentals WHERE status='active';")).rows[0].count;
    res.json({ totalUsers, totalRentals, activeRentals });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get pending users (approved=false)
router.get('/pending-users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const pending = (await db.query('SELECT * FROM users WHERE approved=false ORDER BY created_at DESC;')).rows;
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});

// Approve rental (admin only)
router.patch('/rental/:id/approve', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const rental = await db.findOne('rentals', { id: req.params.id });
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    const updated = await db.update('rentals', { id: req.params.id }, { approved: true }, '*');
    res.json(updated[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve rental' });
  }
});

// Get all pending rentals (only those not approved)
router.get('/pending-rentals', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM rentals WHERE approved = false ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending rentals' });
  }
});

module.exports = router;