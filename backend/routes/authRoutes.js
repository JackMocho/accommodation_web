const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const jwtUtils = require('../utils/jwtUtils');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, phone, name, town, role } = req.body;
    const existing = await db.findOne('users', { email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await db.insert('users', { email, password: hashed, name, role: 'user' }, 'id,email,name,role');
    const token = await jwtUtils.signToken({ id: user.id });
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.findOne('users', { email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password || '');
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = await jwtUtils.signToken({ id: user.id });
    // don't return password
    delete user.password;
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;