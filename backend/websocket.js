const WebSocket = require('ws');
const db = require('./utils/supabaseClient');

// simple example: save incoming messages
function initWebsocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw);
        // expect { action: 'message', data: { sender_id, receiver_id, message, rental_id } }
        if (msg.action === 'message' && msg.data) {
          const { sender_id, receiver_id, message, rental_id } = msg.data;
          const saved = await db.insert('messages', { sender_id, receiver_id, rental_id: rental_id || null, message });
          // broadcast to all
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify({ type: 'new_message', message: saved }));
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