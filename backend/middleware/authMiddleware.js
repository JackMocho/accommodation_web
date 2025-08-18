// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabaseClient');

// Auth middleware using Supabase JWT
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }
  const token = authHeader.split(' ')[1];
  try {
    // Verify JWT using your secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch user from DB to get role
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id);
    if (error || !users || users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = users[0]; // Attach full user object including role
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// Admin check middleware (checks user_metadata.role)
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(401).json({ error: 'Not authorized as admin' });
};

module.exports = {
  protect,
  isAdmin,
};