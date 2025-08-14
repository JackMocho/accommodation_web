const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');

router.get('/counts', async (req, res) => {
  try {
    // Count active users (approved and not suspended)
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('approved', true)
      .or('suspended.eq.false,suspended.is.null');
    if (usersError) throw usersError;

    // Count all rentals
    const { count: totalRentals, error: rentalsError } = await supabase
      .from('rentals')
      .select('*', { count: 'exact', head: true });
    if (rentalsError) throw rentalsError;

    // Count active listings (status = 'available')
    const { count: activeRentals, error: activeError } = await supabase
      .from('rentals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available');
    if (activeError) throw activeError;

    res.json({
      totalUsers,
      totalRentals,
      activeRentals,
    });
  } catch (err) {
    console.error('Error fetching stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;