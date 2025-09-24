// src/utils/api.js
import axios from 'axios';

let authToken = null;

const api = axios.create({
  baseURL: 'https://accommodation-web.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
  (config) => {
    const token = authToken || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Allow setting the token from context
export const setApiToken = (token) => {
  authToken = token;
};

export default api;