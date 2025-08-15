// src/utils/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default axios.create({
  baseURL: `${API_URL}/api/rentals`, // no trailing slash needed
});

// Example usage:
export async function registerUser(userData) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) throw new Error('Registration failed');
  return res.json();
}