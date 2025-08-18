const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');
const jwt = require('jsonwebtoken');

// Register User (using Supabase Auth)
router.post('/register', async (req, res) => {
  const { email, password, full_name, phone, role, town, latitude, longitude } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  try {
    // Store password as plain text (NOT recommended for production)
    // const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password, // store as plain text
          full_name,
          phone,
          role,
          town,
          latitude,
          longitude,
        }
      ]);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, user: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Login using Supabase Auth
router.post('/login', async (req, res) => {
  const { email, phone, password } = req.body;
  if ((!email && !phone) || !password) {
    return res.status(400).json({ error: 'Email or phone and password are required' });
  }

  try {
    // Find user by email or phone
    let userQuery;
    if (email) {
      userQuery = supabase.from('users').select('*').eq('email', email);
    } else {
      userQuery = supabase.from('users').select('*').eq('phone', phone);
    }
    const { data: users, error } = await userQuery;
    if (error || !users || users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    const user = users[0];

    // Check password (hashed)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Create JWT
    const token = jwt.sign({ id: user.id, email: user.email, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
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