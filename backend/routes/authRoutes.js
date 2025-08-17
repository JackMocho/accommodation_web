const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');
const jwt = require('jsonwebtoken');

// Register User (using Supabase Auth)
router.post('/register', async (req, res) => {
  const { email, password, full_name, phone, role = 'client', town, latitude, longitude } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError) throw authError;

    // Insert profile in users table
    const { error: userError } = await supabase.from('users').insert([{
      id: authUser.user.id,
      full_name,
      phone,
      role,
      town,
      latitude,
      longitude,
      approved: false,
      suspended: false,
      superuser: false, // <-- add this line!
      password, // store as plain text (not recommended for production)
    }]);
    if (userError) throw userError;

    res.json({ message: 'Registration successful. Awaiting approval.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Login using Supabase Auth
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });
    res.json({ token: data.session.access_token, user: data.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Legacy registration (plain text password, not recommended for production)
router.post('/legacy-register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email, password, phone }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  // Optionally, create a JWT and return it
  const token = jwt.sign({ id: data[0].id, email: data[0].email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: data[0], token });
});

module.exports = router;