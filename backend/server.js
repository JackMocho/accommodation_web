const cors = require('cors');
require('dotenv').config();
const express = require('express');
const http = require('http');
const chatRoutes = require('./routes/chatRoutes'); // <-- Add this line
const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: [
    'https://accommodation-frontend-iyc3.onrender.com', // your deployed frontend
    'http://localhost:5173' // for local development
  ],
  credentials: true,
}));
app.use(express.json());

app.use('/api/chat', chatRoutes);

// Mount routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
const rentalRoutes = require('./routes/rentalRoutes');
app.use('/api/rentals', rentalRoutes);
const statsRoutes = require('./routes/statsRoutes');
app.use('/api/stats', statsRoutes);
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Setup WebSockets
const setupWebSocket = require('./websocket');
setupWebSocket(server); // ✅ Now this works

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});