const cors = require('cors');
const express = require('express');
const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

// Defensive patch: prevent mounting full URLs or strings with '?' as route paths.
// This helps surface the exact file/line that tries to use a full URL as a route.
const originalAppUse = app.use.bind(app);
app.use = function (firstArg, ...rest) {
  if (typeof firstArg === 'string' && (firstArg.startsWith('http://') || firstArg.startsWith('https://') || firstArg.includes('?'))) {
    console.error(`Invalid app.use() mount path detected: ${firstArg}`);
    throw new Error(`Invalid mount path for app.use(): "${firstArg}". Use a path starting with '/' (no protocol, host, or query string).`);
  }
  return originalAppUse(firstArg, ...rest);
};

// Patch Router.prototype.use to catch router.use(...) mistakes too
const expressRouter = require('express').Router;
const origRouterUse = expressRouter.prototype.use;
expressRouter.prototype.use = function (firstArg, ...rest) {
  if (typeof firstArg === 'string' && (firstArg.startsWith('http://') || firstArg.startsWith('https://') || firstArg.includes('?'))) {
    console.error(`Invalid router.use() mount path detected: ${firstArg}`);
    throw new Error(`Invalid mount path for router.use(): "${firstArg}". Use a path starting with '/' (no protocol, host, or query string).`);
  }
  return origRouterUse.call(this, firstArg, ...rest);
};

// CORS: allow a full origin string via env (e.g. https://app.example.com) but do NOT use it as a mount path.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploads/static if needed
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Mount routes using path strings only (no full URLs)
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

// WebSocket initializer accepts the http server
const initWebsocket = require('./websocket');
initWebsocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});