const express = require('express');
const db = require('../config/db');
const { signToken } = require('../utils/jwtUtils');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    let {
      email,
      password,
      full_name,
      phone,
      town,
      latitude,
      longitude,
      role,
    } = req.body;

    if (!full_name || !email || !password || !phone || !role) {
      return res
        .status(400)
        .json({ error: 'full_name, email, password, phone and role are required' });
    }

    // Add stricter phone validation
    if (typeof phone !== 'string' || phone.trim().length < 7) {
      return res.status(400).json({ error: 'A valid phone number is required.' });
    }

    // Accept only "client", "landlord", or "admin" for role
    const allowedRoles = ['client', 'landlord', 'admin'];
    if (!allowedRoles.includes(role)) {
      console.error('Invalid role value received:', role);
      return res.status(400).json({ error: `role must be one of: ${allowedRoles.join(', ')}` });
    }

    email = String(email).trim().toLowerCase();
    phone = String(phone).trim();
    full_name = String(full_name).trim();

    const lat = latitude === undefined || latitude === '' || latitude === null ? undefined : Number(latitude);
    const lng = longitude === undefined || longitude === '' || longitude === null ? undefined : Number(longitude);

    if ((lat !== undefined && Number.isNaN(lat)) || (lng !== undefined && Number.isNaN(lng))) {
      return res.status(400).json({ error: 'latitude and longitude must be valid numbers' });
    }

    const existing = await db.findOne('users', { email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    // Save password as plain text
    const insertData = {
      email,
      password, // plain text
      name: full_name,
      role,
      phone,
    };
    if (town) insertData.town = town;
    if (lat !== undefined) insertData.latitude = lat;
    if (lng !== undefined) insertData.longitude = lng;

    const created = await db.insert('users', insertData, 'id');

    const user = await db.findOne('users', { id: created.id });
    if (user && user.password) delete user.password;

    const token = await signToken({ id: created.id });

    res.json({ user, token, message: 'Registration successful, You can Contact Administrator for approval' });
  } catch (err) {
    console.error('Register error:', err.stack || err);
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    // Support login by email or phone
    const query = email ? { email } : phone ? { phone } : null;
    if (!query) return res.status(400).json({ error: 'Email or phone required' });

    const user = await db.findOne('users', query);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Check approval and suspension
    if (!user.approved) return res.status(403).json({ error: 'Account not approved yet.' });
    if (user.suspended) return res.status(403).json({ error: 'Account is suspended.' });

    // Compare plain text password
    if (user.password !== password) return res.status(401).json({ error: 'Invalid credentials' });

    const token = await signToken({ id: user.id });
    if (user.password) delete user.password;
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;