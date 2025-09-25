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
    // Use the same value for all owner/landlord fields
    const ownerId = req.user.id;
    const data = {
      ...req.body,
      landlord_id: ownerId,
      owner_id: ownerId,
      user_id: ownerId,
    };
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
    // Accept any of the three fields for ownership check
    const isOwner =
      [rental.owner_id, rental.landlord_id, rental.user_id].includes(req.user.id) ||
      req.user.role === 'admin';
    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const updated = await db.update('rentals', { id: req.params.id }, req.body, '*');
    res.json(updated[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update rental' });
  }
});

// Update rental status (owner or admin)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const rentalId = req.params.id;
    const { status } = req.body;
    if (!['booked', 'available'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const rental = await db.findOne('rentals', { id: rentalId });
    if (!rental) return res.status(404).json({ error: 'Rental not found' });

    // Accept any of the three fields for ownership check
    const isOwner =
      [rental.owner_id, rental.landlord_id, rental.user_id].includes(req.user.id) ||
      req.user.role === 'admin';
    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await db.update('rentals', { id: rentalId }, { status }, '*');
    res.json(updated[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update rental status' });
  }
});

// Delete rental
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const rental = await db.findOne('rentals', { id: req.params.id });
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    // Accept any of the three fields for ownership check
    const isOwner =
      [rental.owner_id, rental.landlord_id, rental.user_id].includes(req.user.id) ||
      req.user.role === 'admin';
    if (!isOwner) {
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
  let userId = req.query.id;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  try {
    userId = parseInt(userId, 10); // <-- Ensure userId is an integer
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid User ID' });

    // Fetch rentals where any of the three fields match
    const rentals = await db.query(
      `SELECT * FROM rentals WHERE owner_id = $1 OR landlord_id = $1 OR user_id = $1`,
      [userId]
    );
    res.json(rentals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user rentals' });
  }
});

// Book a rental (authenticated users)
router.put('/:id/book', authenticate, async (req, res) => {
  try {
    const rentalId = req.params.id;
    const rental = await db.findOne('rentals', { id: rentalId });
    if (!rental) return res.status(404).json({ error: 'Rental not found' });

    // Mark as booked (set status)
    const updated = await db.update('rentals', { id: rentalId }, { status: 'booked' }, '*');
    res.json(updated[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to book rental' });
  }
});

module.exports = router;