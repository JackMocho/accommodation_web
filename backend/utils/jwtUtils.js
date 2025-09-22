const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'change-me';

function generateToken(payload, expiresIn = '7d') {
    return jwt.sign(payload, SECRET, { expiresIn });
}

function verifyToken(token) {
    return jwt.verify(token, SECRET);
}

module.exports = { generateToken, verifyToken };