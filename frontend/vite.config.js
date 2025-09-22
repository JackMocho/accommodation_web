import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const hmrHost = process.env.VITE_HMR_HOST || 'localhost';
  const hmrProtocol = process.env.VITE_HMR_PROTOCOL || 'ws';
  const hmrPort = process.env.VITE_HMR_PORT ? Number(process.env.VITE_HMR_PORT) : 5173;

  return {
    plugins: [react()],
    server: {
      // only used for dev — use env vars when you need HMR from a remote host
      hmr: {
        host: hmrHost,
        protocol: hmrProtocol,
        port: hmrPort,
      },
    },
  };
});