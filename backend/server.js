const cors = require('cors');
require('dotenv').config();
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'https://accommodation-web-pyz9.onrender.com',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '30mb' })); // Increased JSON body size limit
app.use(express.urlencoded({ limit: '30mb', extended: true })); // Increased URL-encoded body size limit

// Mount routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const rentalRoutes = require('./routes/rentalRoutes');
app.use('/api/rentals', rentalRoutes);

const statsRoutes = require('./routes/statsRoutes');
app.use('/api/stats', statsRoutes);

const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// CORS-enabled 404 handler (should be after all routes)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', [
    'https://accommodation-web-pyz9.onrender.com',
    'https://accommodation-web.onrender.com',
    'http://localhost:5173'
  ]);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  res.status(404).json({ error: 'Not found' });
});

// Setup WebSockets
const setupWebSocket = require('./websocket');
setupWebSocket(server); // ✅ Now this works

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});