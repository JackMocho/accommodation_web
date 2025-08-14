// backend/middleware/authMiddleware
const supabase = require('../utils/supabaseClient');

// Auth middleware using Supabase JWT
async function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }
  const token = authHeader.split(' ')[1];
  try {
    // Validate JWT with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Token is not valid' });
    }
    req.user = data.user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
}

// Admin check middleware (checks user_metadata.role)
function isAdmin(req, res, next) {
  if (
    req.user &&
    (req.user.role === 'admin' ||
      req.user.user_metadata?.role === 'admin')
  ) {
    return next();
  }
  return res.status(403).json({ error: 'Not authorized as admin' });
}

module.exports = {
  protect,
  isAdmin,
};