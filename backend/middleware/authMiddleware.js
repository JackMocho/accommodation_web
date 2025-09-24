// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const db = require('../config/db');
const jwtUtils = require('../utils/jwtUtils');

/**
 * Middleware to protect routes using JWT.
 * Attaches the full user object to req.user if valid.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.findOne('users', { id: decoded.id });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('JWT error:', err); // <--- Add this line
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to check if user is admin.
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(401).json({ error: 'Not authorized as admin' });
};

/**
 * Middleware to authenticate user using JWT and attach user object.
 * Uses jwtUtils for verification.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.findOne('users', { id: decoded.id });
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to require a specific user role.
 * Usage: requireRole('admin', 'landlord')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
};

module.exports = {
  protect,
  isAdmin,
  authenticate,
  requireRole,
};