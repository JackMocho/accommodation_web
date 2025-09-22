const express = require('express');
const router = express.Router();
const db = require('../utils/supabaseClient');
const jwtUtils = require('../utils/jwtUtils');
const encrypt = require('../utils/encryptData');

// Register User (using Supabase Auth)
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, phone, name, town } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existing = await db.findOne('users', { email });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    let storedPassword = password;
    if (encrypt && encrypt.hash) storedPassword = await encrypt.hash(password);

    const newUser = await db.insert('users', {
      email,
      password: storedPassword,
      full_name,
      name,
      phone,
      town,
      approved: false,
      role: 'client'
    });

    const token = jwtUtils.generateToken({ id: newUser.id, email: newUser.email, role: newUser.role });

    res.json({ user: newUser, token });
  } catch (err) {
    console.error('Register error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login using Supabase Auth
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await db.findOne('users', { email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    let match = false;
    if (encrypt && encrypt.compare) match = await encrypt.compare(password, user.password);
    else match = password === user.password;

    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwtUtils.generateToken({ id: user.id, email: user.email, role: user.role });
    res.json({ user, token });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;