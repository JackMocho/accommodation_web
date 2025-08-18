const express = require('express');
const supabase = require('../utils/supabaseClient');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// 1. User Management
router.get('/users', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Failed to fetch users.' });
  res.json(data);
});

router.patch('/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', id)
    .select('id, name, email, role')
    .single();
  if (error) return res.status(500).json({ error: 'Failed to update user role.' });
  res.json(data);
});

router.patch('/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { data, error } = await supabase
    .from('users')
    .update({ status })
    .eq('id', id)
    .select('id, name, email, status')
    .single();
  if (error) return res.status(500).json({ error: 'Failed to update user status.' });
  res.json(data);
});

router.patch('/users/:id/approved', async (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;
  const { data, error } = await supabase
    .from('users')
    .update({ approved })
    .eq('id', id)
    .select('id, name, email, approved')
    .single();
  if (error) return res.status(500).json({ error: 'Failed to update user approval.' });
  res.json(data);
});

// Suspend user and set approved to false
router.put('/user/:id/suspend', async (req, res) => {
  const { id } = req.params;
  const { data: user, error: userError } = await supabase.from('users').select('superuser').eq('id', id).single();
  if (userError) return res.status(500).json({ error: 'Failed to fetch user.' });
  if (user && user.superuser) {
    return res.status(403).json({ error: 'You cannot suspend this Special User.' });
  }
  const { error } = await supabase.from('users').update({ suspended: true, approved: false }).eq('id', id);
  if (error) return res.status(500).json({ error: 'Failed to suspend user' });
  res.json({ message: 'User suspended and moved to pending' });
});

router.delete('/user/:id', async (req, res) => {
  const { id } = req.params;
  const { data: user, error: userError } = await supabase.from('users').select('superuser').eq('id', id).single();
  if (userError) return res.status(500).json({ error: 'Failed to fetch user.' });
  if (user && user.superuser) {
    return res.status(403).json({ error: ' Stop it! You can never Delete this Special User.' });
  }
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) return res.status(500).json({ error: 'Failed to delete user.' });
  res.json({ message: 'User deleted' });
});

router.get('/active-users', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('approved', true)
    .eq('suspended', false);
  if (error) return res.status(500).json({ error: 'Failed to fetch active users.' });
  res.json(data);
});

// Get all pending users (not approved, not suspended)
router.get('/pending-users', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('approved', false)
    .or('suspended.eq.false,suspended.is.null')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Failed to fetch pending users' });
  res.json(data);
});

// Approve a user (admin action)
router.put('/approve-user/:id', protect, isAdmin, async (req, res) => {
  const userId = req.params.id;
  const { error } = await supabase
    .from('users')
    .update({ approved: true, suspended: false })
    .eq('id', userId);
  if (error) return res.status(500).json({ error: 'Failed to approve user' });
  res.json({ message: 'User approved' });
});

// 2. Rental Management
router.get('/rentals', async (req, res) => {
  const { data, error } = await supabase.from('rentals').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/rental/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('rentals').update({ approved: true }).eq('id', id);
  if (error) return res.status(500).json({ error: 'Failed to approve rental.' });
  res.json({ message: 'Rental approved' });
});

// Admin: Delete any rental
router.delete('/rental/:id', protect, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('rentals').delete().eq('id', id);
  if (error) return res.status(500).json({ error: 'Failed to delete rental' });
  res.json({ message: 'Rental deleted by admin' });
});

// 3. Analytics (example: counts)
router.get('/stats', async (req, res) => {
  const { count: userCount, error: userError } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: rentalCount, error: rentalError } = await supabase.from('rentals').select('*', { count: 'exact', head: true });
  const { count: activeRentalCount, error: activeRentalError } = await supabase
    .from('rentals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'available');
  if (userError || rentalError || activeRentalError) {
    return res.status(500).json({ error: 'Failed to fetch stats.' });
  }
  res.json({
    totalUsers: userCount,
    totalRentals: rentalCount,
    activeRentals: activeRentalCount,
  });
});

// 4. Moderation: Reported messages/rentals
router.get('/reports', async (req, res) => {
  const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Failed to fetch reports.' });
  res.json(data);
});

// 5. Announcements
router.post('/announcement', async (req, res) => {
  const { message, target } = req.body;
  // Save to DB or broadcast via websocket if needed
  // Example: await supabase.from('announcements').insert([{ message, target }]);
  res.json({ message: 'Announcement sent' });
});

// 6. Audit Logs (example)
router.get('/audit', async (req, res) => {
  const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Failed to fetch audit logs.' });
  res.json(data);
});

module.exports = router;