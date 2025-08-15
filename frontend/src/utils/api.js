// src/utils/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token automatically if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// Example usage:
export async function registerUser(userData) {
  const res = await api.post('/auth/register', userData);
  return res.data;
}

export async function fetchRentals() {
  const res = await api.get('/rentals');
  return res.data;
}