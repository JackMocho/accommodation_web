// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const db = require('../config/db');
const jwtUtils = require('../utils/jwtUtils');

// Auth middleware using JWT from local DB
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
    const user = await db.findOne('users', { id: decoded.id });
    if (!user || !user.id) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user; // Attach full user object including role
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// Admin check middleware
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(401).json({ error: 'Not authorized as admin' });
};

// Custom authentication middleware
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const payload = await jwtUtils.verifyToken(token);
    if (!payload || !payload.id) return res.status(401).json({ error: 'Invalid token' });

    const user = await db.findOne('users', { id: payload.id });
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.suspended) return res.status(403).json({ error: 'Account suspended' });

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
}

module.exports = {
  protect,
  isAdmin,
  authenticate,
  requireRole,
};

module.exports.authenticate = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};