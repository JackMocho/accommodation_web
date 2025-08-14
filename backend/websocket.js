const WebSocket = require('ws');
const supabase = require('./utils/supabaseClient');

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'SEND_MESSAGE') {
          // Save to Supabase
          const { error } = await supabase.from('messages').insert([{
            sender_id: data.sender_id,
            receiver_id: data.receiver_id,
            rental_id: data.rental_id,
            message: data.message,
            created_at: new Date().toISOString()
          }]);
          if (error) {
            console.error('Supabase insert error:', error.message);
            return;
          }

          // Broadcast to receiver
          wss.clients.forEach((client) => {
            if (client.id === data.receiver_id && client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
          });
        }
      } catch (err) {
        console.error('Message failed:', err.message);
      }
    });
  });
}

module.exports = setupWebSocket;