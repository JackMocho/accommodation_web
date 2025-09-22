// src/hooks/useSocket.js
import { useEffect, useRef } from 'react';

export default function useSocket(path = '/ws', onMessage) {
  const socketRef = useRef(null);

  useEffect(() => {
    const envWS = import.meta.env.VITE_WS_URL;
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
    let wsUrl = '';

    if (envWS) {
      wsUrl = envWS.replace(/\/$/, '');
    } else {
      try {
        const u = new URL(apiUrl);
        const scheme = u.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${scheme}//${u.host}${path}`;
      } catch (e) {
        // fallback to current origin
        const scheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${scheme}//${window.location.host}${path}`;
      }
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