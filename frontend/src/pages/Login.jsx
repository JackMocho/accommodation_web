import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier || !password) {
      alert('Please enter both identifier and password');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        identifier,
        password,
      });

      localStorage.setItem('token', res.data.token);

      // Decode JWT payload (second part)
      const decoded = JSON.parse(atob(res.data.token.split('.')[1]));
      localStorage.setItem('userId', decoded.id);
      localStorage.setItem('userRole', decoded.role);

      // Optionally fetch and store userName
      const userRes = await axios.get(`http://localhost:5000/api/users/${decoded.id}`, {
        headers: { Authorization: `Bearer ${res.data.token}` }
      });
      localStorage.setItem('userName', userRes.data.full_name);

      login(res.data.token);

      // Redirect based on role
      if (decoded.role === 'admin') {
        navigate('/admin');
      } else if (decoded.role === 'landlord') {
        navigate('/landlord-dashboard');
      } else {
        navigate('/client-dashboard');
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      alert(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900 px-2">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 md:p-10 rounded shadow-md w-full max-w-md space-y-4">
        <h2 className="text-4xl font-bold text-center mb-4 text-white">Login</h2>
        <input
          name="identifier"
          placeholder="Email or Phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 text-white"
        />
        <input
          name="password"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 text-white"
        />
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
        >
          Login
        </button>
        <p className="text-xl text-center mt-4 text-gray-300">
          Don't have an account?{' '}
          <a href="/register" className="text-blue-400 underline">Register</a>
        </p>
      </form>
    </div>
  );
}