const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');

router.get('/counts', async (req, res) => {
  const { data: rentals, error: rentalsError } = await supabase.from('rentals').select('id');
  const { data: users, error: usersError } = await supabase.from('users').select('id');
  if (rentalsError || usersError) {
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
  res.json({
    rentals: rentals.length,
    users: users.length,
  });
});

module.exports = router;