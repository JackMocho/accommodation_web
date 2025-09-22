// src/utils/api.js
import axios from 'axios';

const BASE = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.replace(/\/$/, '')) || window.location.origin.replace(/\/$/, '');
const API_PREFIX = '/api';

const api = axios.create({
    baseURL: `${BASE}${API_PREFIX}`,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

export default api;