// src/hooks/useSocket.js
import { useEffect, useState } from 'react';

export default function useSocket() {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000');

    ws.onopen = () => {
      setSocket(ws);
      ws.send(JSON.stringify({ type: 'CLIENT_READY', id: localStorage.getItem('userId') }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'NEW_MESSAGE') {
          setNotifications(prev => [
            ...prev,
            {
              from: msg.sender_id,
              message: msg.message,
              rental_id: msg.rental_id,
              time: new Date().toLocaleTimeString(),
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to parse socket message:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return { notifications, clearNotifications: () => setNotifications([]) };
}