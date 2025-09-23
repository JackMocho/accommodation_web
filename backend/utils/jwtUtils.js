const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'bc5b242e8fade0bbce2562d734ef102fbc058b7f19139cbb54e11f11160b604a';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

module.exports = { signToken };