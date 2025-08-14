const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');

// Submit new rental
router.post('/submit', async (req, res) => {
  const { title, description, price, nightly_price, type, mode, lat, lng, user_id, images, town } = req.body;
  if (!title || !type || !mode || !user_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (mode === 'lodging' && !nightly_price) {
    return res.status(400).json({ error: 'Nightly price required for lodging' });
  }
  if (mode === 'rental' && !price) {
    return res.status(400).json({ error: 'Monthly price required for rental' });
  }

  // Encrypt images if needed, or just store as is
  // const encryptedImages = images.map(img => encrypt(img));
  // For now, just store as JSON
  const imagesToStore = JSON.stringify(images);

  let locationSQL = 'NULL';
  let locationParams = [];
  if (lat && lng) {
    locationSQL = 'ST_SetSRID(ST_Point($9, $10), 4326)';
    locationParams = [lng, lat];
  }

  try {
    await db.query(
      `INSERT INTO rentals (title, description, price, nightly_price, type, mode, images, town, location, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ST_SetSRID(ST_Point($9, $10), 4326), $11)`,
      [title, description, price, nightly_price, type, mode, JSON.stringify(images), town, lng, lat, user_id]
    );
    res.json({ message: 'Rental submitted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit rental' });
  }
});

// Get all rentals (admin only)
router.get('/all', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.*, 
        CASE 
          WHEN r.location IS NOT NULL 
          THEN ST_AsGeoJSON(r.location)::json 
          ELSE NULL 
        END AS location_geojson,
        u.full_name AS landlord_name
      FROM rentals r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);
    const rentals = result.rows.map(r => {
      if (r.location_geojson) {
        r.location = r.location_geojson;
        delete r.location_geojson;
      }
      return r;
    });
    res.json(rentals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rentals' });
  }
});

// Get rentals for the logged-in user
router.get('/user', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  let userId;
  try {
    const decoded = verifyToken(token);
    userId = decoded.id;
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const result = await db.query(
      `SELECT * FROM rentals
       WHERE user_id = $1
         AND (status = 'available' OR status = 'booked')
         AND (mode = 'rental' OR mode = 'lodging' OR mode = 'airbnb')
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rentals' });
  }
});

// Get all rentals (public)
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, 
        CASE 
          WHEN r.location IS NOT NULL 
          THEN ST_AsGeoJSON(r.location)::json 
          ELSE NULL 
        END AS location_geojson,
        u.full_name AS landlord_name
      FROM rentals r
      JOIN users u ON r.user_id = u.id
      WHERE r.status = 'available'
        AND u.role = 'landlord'
        AND u.approved = TRUE
        AND (r.mode = 'rental' OR r.mode = 'lodging' OR r.mode = 'airbnb')
      ORDER BY r.created_at DESC`
    );
    const rentals = result.rows.map(r => {
      if (r.location_geojson) {
        r.location = r.location_geojson;
        delete r.location_geojson;
      }
      return r;
    });
    res.json(rentals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rentals' });
  }
});

// Nearby rentals
router.get('/nearby', async (req, res) => {
  const { lat, lng, distance } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng required' });
  }
  const dist = distance || 5; // default 5km
  try {
    const result = await db.query(
      `
      SELECT r.*, 
        CASE 
          WHEN r.location IS NOT NULL 
          THEN ST_AsGeoJSON(r.location)::json 
          ELSE NULL 
        END AS location_geojson,
        u.full_name AS landlord_name
      FROM rentals r
      JOIN users u ON r.user_id = u.id
      WHERE r.location IS NOT NULL
        AND r.status = 'available'
        AND u.role = 'landlord'
        AND u.approved = TRUE
        AND (r.mode = 'rental' OR r.mode = 'lodging' OR r.mode = 'airbnb')
        AND ST_DWithin(
          r.location::geography,
          ST_SetSRID(ST_Point($1, $2), 4326)::geography,
          $3 * 1000
        )
      ORDER BY r.created_at DESC
      `,
      [lng, lat, dist]
    );
    const rentals = result.rows.map(r => {
      if (r.location_geojson) {
        r.location = r.location_geojson;
        delete r.location_geojson;
      }
      return r;
    });
    res.json(rentals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nearby rentals' });
  }
});

// Rentals in a specified town
router.get('/town/:town', async (req, res) => {
  const { town } = req.params;
  try {
    const result = await db.query(
      `SELECT r.*, 
        CASE 
          WHEN r.location IS NOT NULL 
          THEN ST_AsGeoJSON(r.location)::json 
          ELSE NULL 
        END AS location_geojson,
        u.full_name AS landlord_name
      FROM rentals r
      JOIN users u ON r.user_id = u.id
      WHERE LOWER(r.town) = LOWER($1)
        AND r.status = 'available'
        AND u.role = 'landlord'
        AND u.approved = TRUE
        AND (r.mode = 'rental' OR r.mode = 'lodging' OR r.mode = 'airbnb')
      ORDER BY r.created_at DESC`,
      [town]
    );
    const rentals = result.rows.map(r => {
      if (r.location_geojson) {
        r.location = r.location_geojson;
        delete r.location_geojson;
      }
      return r;
    });
    res.json(rentals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rentals by town' });
  }
});

// Update a rental
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { data, error } = await supabase.from('rentals').update(updates).eq('id', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// Delete a rental
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('rentals').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

module.exports = router;