const WebSocket = require('ws');

function initWebsocket(server, dbClient) {
  const db = dbClient || require('./config/db');
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.action === 'message' && msg.data) {
          const { sender_id, receiver_id, rental_id, message, parent_id } = msg.data;
          const payloadRow = {
            sender_id,
            receiver_id,
            rental_id: rental_id || null,
            parent_id: parent_id || null,
            message,
            created_at: new Date()
          };
          // insert returns the inserted row (using config/db.insert)
          const saved = await db.insert('messages', payloadRow, '*');
          const payload = JSON.stringify({ type: 'new_message', message: saved });
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) client.send(payload);
          });
        }
      } catch (err) {
        console.error('WebSocket message error', err);
      }
    });
  });

  return wss;
}

module.exports = initWebsocket;