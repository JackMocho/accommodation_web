const express = require('express');
const router = express.Router();
const db = require('../utils/supabaseClient');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// create rental
router.post('/', authenticate, requireRole('landlord', 'admin'), async (req, res) => {
  try {
    const payload = { ...req.body, landlord_id: req.user.id };
    const created = await db.insert('rentals', payload);
    res.json(created);
  } catch (err) {
    console.error('Create rental error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// get list (with optional filters & safe sort)
router.get('/', async (req, res) => {
  try {
    const filters = {};
    ['town', 'landlord_id', 'mode', 'approved', 'status'].forEach(k => {
      if (req.query[k] !== undefined) filters[k] = req.query[k];
    });

    let rows;
    if (Object.keys(filters).length) {
      rows = await db.findBy('rentals', filters);
    } else {
      // only allow a small whitelist of sortable columns to avoid SQL injection
      const allowedSort = new Set(['created_at', 'price']);
      const sort = allowedSort.has(req.query.sort) ? req.query.sort : 'created_at';
      rows = (await db.query(`SELECT * FROM rentals ORDER BY ${sort} DESC;`)).rows;
    }

    res.json(rows);
  } catch (err) {
    console.error('Get rentals error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// nearby search (lat,lng, radius meters) - keep before :id route
router.get('/nearby/search', async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat & lng required' });
    const sql = `
      SELECT *, ST_DistanceSphere(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)) AS distance_m
      FROM rentals
      WHERE geom IS NOT NULL AND ST_DWithin(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326), $3)
      ORDER BY distance_m ASC
      LIMIT 200;
    `;
    const rows = (await db.query(sql, [parseFloat(lng), parseFloat(lat), parseFloat(radius)])).rows;
    res.json(rows);
  } catch (err) {
    console.error('Nearby search error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// get by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await db.findOne('rentals', { id });
    if (!rental) return res.status(404).json({ error: 'Not found' });
    return res.json(rental);
  } catch (err) {
    console.error('Get rental by id error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// update rental
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await db.findOne('rentals', { id });
    if (!rental) return res.status(404).json({ error: 'Not found' });
    if (rental.landlord_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const updated = await db.update('rentals', { id }, req.body);
    res.json(updated[0]);
  } catch (err) {
    console.error('Update rental error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// delete rental
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await db.findOne('rentals', { id });
    if (!rental) return res.status(404).json({ error: 'Not found' });
    if (rental.landlord_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const deleted = await db.del('rentals', { id });
    res.json(deleted[0]);
  } catch (err) {
    console.error('Delete rental error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;