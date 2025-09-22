// src/utils/api.js
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path, { method = 'GET', body, token, headers = {} } = {}) {
  const url = `${API.replace(/\/$/, '')}/api${path.startsWith('/') ? path : '/' + path}`;
  const opts = { method, headers: { ...headers } };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export default {
  get: (path, token) => request(path, { method: 'GET', token }),
  post: (path, body, token) => request(path, { method: 'POST', body, token }),
  put: (path, body, token) => request(path, { method: 'PUT', body, token }),
  del: (path, token) => request(path, { method: 'DELETE', token }),
};