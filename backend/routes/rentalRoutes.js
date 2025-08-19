const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');

// Submit new rental
router.post('/submit', async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      nightly_price,
      mode,
      type,
      status,
      images,
      lat,
      lng,
      town,
      user_id,
      landlord_id,
      location,
    } = req.body;

    // Accept either user_id or landlord_id
    const finalLandlordId = landlord_id || user_id;

    // Validate required fields
    if (!title || !mode || !type || !finalLandlordId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Build location object if lat/lng provided
    let finalLocation = location;
    if (!finalLocation && lat && lng) {
      finalLocation = { coordinates: [lng, lat] };
    }

    // Ensure both price and nightly_price are numbers (default to 0)
    const monthlyPrice = Number(price) || 0;
    const nightlyPrice = Number(nightly_price) || 0;

    // Insert into DB
    const { data, error } = await supabase
      .from('rentals')
      .insert([
        {
          title,
          description,
          price: monthlyPrice,
          nightly_price: nightlyPrice,
          mode,
          type,
          status: status || 'available',
          images: images,
          location: finalLocation,
          town,
          landlord_id: finalLandlordId,
          user_id: finalLandlordId,
          latitude: lat || null,
          longitude: lng || null,
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true, rental: data[0] });
  } catch (err) {
    console.error('Rental submit error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Get all rentals (admin only)
router.get('/all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select('*, users!inner(full_name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    // Add landlord_name for compatibility
    const rentals = data.map(r => ({
      ...r,
      landlord_name: r.users?.full_name || null
    }));
    res.json(rentals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rentals' });
  }
});

// Get rentals for the logged-in user
router.get('/user/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select('*')
      .eq('user_id', user_id)
      .in('status', ['available', 'booked'])
      .in('mode', ['rental', 'lodging', 'airbnb'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rentals' });
  }
});

// Get all rentals (public)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select('*, users!inner(full_name, role, approved)')
      .eq('status', 'available')
      .eq('users.role', 'landlord')
      .eq('users.approved', true)
      .in('mode', ['rental', 'lodging', 'airbnb'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    // Add landlord_name for compatibility
    const rentals = data.map(r => ({
      ...r,
      landlord_name: r.users?.full_name || null
    }));
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
  // Supabase/Postgres doesn't support geospatial queries via JS client directly.
  // You may need to use a Postgres function or filter in JS for now.
  // Here, we fetch all and filter in JS (not efficient for large datasets).
  const dist = distance || 5; // default 5km
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select('*, users!inner(full_name, role, approved)')
      .eq('status', 'available')
      .eq('users.role', 'landlord')
      .eq('users.approved', true)
      .in('mode', ['rental', 'lodging', 'airbnb']);
    if (error) throw error;
    // Filter by distance in JS (Haversine formula)
    const toRad = x => (x * Math.PI) / 180;
    const R = 6371; // km
    const filtered = data.filter(r => {
      if (!r.latitude || !r.longitude) return false;
      const dLat = toRad(r.latitude - lat);
      const dLon = toRad(r.longitude - lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat)) *
          Math.cos(toRad(r.latitude)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;
      return d <= dist;
    });
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nearby rentals' });
  }
});

// Rentals in a specified town
router.get('/town/:town', async (req, res) => {
  const { town } = req.params;
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select('*, users!inner(full_name, role, approved)')
      .eq('status', 'available')
      .eq('users.role', 'landlord')
      .eq('users.approved', true)
      .ilike('town', town)
      .in('mode', ['rental', 'lodging', 'airbnb'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rentals = data.map(r => ({
      ...r,
      landlord_name: r.users?.full_name || null
    }));
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

// Get rentals for a specific user (expects user id in query or JWT)
router.get('/user', async (req, res) => {
  const userId = req.query.id;
  if (!userId) {
    return res.status(400).json({ error: 'User id required' });
  }
  const { data, error } = await supabase.from('rentals').select('*').eq('user_id', userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Book or unbook a rental (toggle status)
router.put('/:id/book', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['booked', 'available'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const { data, error } = await supabase
      .from('rentals')
      .update({ status })
      .eq('id', id)
      .select();
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: 'Rental not found' });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single rental by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return res.status(404).json({ error: 'Rental not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;