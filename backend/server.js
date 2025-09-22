const cors = require('cors');
const express = require('express');
const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

// enable CORS for frontend origin(s)
const allowedOrigin = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// serve uploaded files (if frontend expects /uploads/*)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// mount routes (ensure these files exist)
const authRoutes = require('./routes/authRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const statsRoutes = require('./routes/statsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);

// websockets (websocket.js exports initializer that accepts server)
const initWebsocket = require('./websocket');
initWebsocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});