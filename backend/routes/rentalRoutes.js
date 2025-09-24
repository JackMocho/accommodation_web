const express = require('express');
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// List rentals (optional filters via query)
router.get('/', async (req, res) => {
  try {
    const filters = {};
    if (req.query.city) filters.city = req.query.city;
    const rentals = await db.findBy('rentals', filters);
    res.json(rentals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rentals' });
  }
});

// Create rental (authenticated users)
router.post('/', authenticate, async (req, res) => {
  try {
    const data = { ...req.body, owner_id: req.user.id };
    const rental = await db.insert('rentals', data, '*');
    res.json(rental);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create rental' });
  }
});

// Update rental (owner or admin)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const rental = await db.findOne('rentals', { id: req.params.id });
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    if (rental.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const updated = await db.update('rentals', { id: req.params.id }, req.body, '*');
    res.json(updated[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update rental' });
  }
});

// Delete rental
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const rental = await db.findOne('rentals', { id: req.params.id });
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    if (rental.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const deleted = await db.del('rentals', { id: req.params.id });
    res.json(deleted[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete rental' });
  }
});

// Get rentals by user ID
router.get('/user', authenticate, async (req, res) => {
  const userId = req.query.id;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  try {
    const rentals = await db.findBy('rentals', { owner_id: userId });
    res.json(rentals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user rentals' });
  }
});

module.exports = router;