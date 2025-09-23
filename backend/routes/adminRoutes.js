const express = require('express');
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

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
router.post('/users/:id/approve', authenticate, requireRole('admin'), async (req, res) => {
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
router.post('/users/:id/suspend', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    const { suspended } = req.body;
    const updated = await db.update('users', { id: userId }, { suspended: !!suspended }, '*');
    res.json(updated[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await db.del('users', { id: req.params.id });
    res.json(deleted[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all rentals
router.get('/rentals', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const rentals = await db.findAll('rentals');
    res.json(rentals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rentals' });
  }
});

// Get system stats
router.get('/stats', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const totalUsers = await db.count('users');
    const totalRentals = await db.count('rentals');
    const activeRentals = await db.count('rentals', { status: 'active' });
    res.json({ totalUsers, totalRentals, activeRentals });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get pending users
router.get('/pending-users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const pending = await db.findBy('users', { approved: false });
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});

module.exports = router;