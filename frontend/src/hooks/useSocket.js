// src/hooks/useSocket.js
import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

export default function useSocket(path = '/ws', onMessage) {
  const socketRef = useRef(null);
  const { token } = useAuth();

  useEffect(() => {
    let wsUrl = '';

    if (token) {
      wsUrl = `wss://accommodation-web.onrender.com/ws?token=${token}`;
    } else {
      wsUrl = `wss://accommodation-web.onrender.com/ws`;
    }

    socketRef.current = new WebSocket(wsUrl);
    socketRef.current.onmessage = (ev) => onMessage && onMessage(JSON.parse(ev.data));
    socketRef.current.onclose = () => { /* reconnect logic if needed */ };
    socketRef.current.onerror = (err) => console.error('Socket error', err);

    return () => {
      socketRef.current?.close();
    };
  }, [path, onMessage]);

  return socketRef;
}