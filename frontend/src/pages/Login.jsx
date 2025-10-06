import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import bgImage from '../assets/image22.jpg';

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

    // Determine if identifier is email or phone
    const isEmail = identifier.includes('@');
    const payload = isEmail
      ? { email: identifier, password }
      : { phone: identifier, password };

    try {
      const res = await api.post('/auth/login', payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.user.id);
      localStorage.setItem('userRole', res.data.user.role);
      localStorage.setItem('userName', res.data.user.full_name || res.data.user.name || '');
      login(res.data.token, res.data.user);

      // Redirect based on role
      if (res.data.user.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (res.data.user.role === 'landlord') {
        navigate('/landlord-dashboard');
      } else {
        navigate('/client-dashboard');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    // ...login logic...
    if (loginSuccess) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          await api.post(
            '/user/location',
            { latitude, longitude },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            }
          );
        });
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${bgImage})`,
          filter: 'brightness(0.4) blur(2px)',
        }}
        aria-hidden="true"
      ></div>
      {/* Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none"></div>

      <form
        onSubmit={handleSubmit}
        className="relative z-20 backdrop-blur-md p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md space-y-6 border-2 border-purple-700"
      >
        <h2 className="text-4xl font-extrabold text-center mb-4 text-white drop-shadow-lg">
          Welcome
        </h2>
        <p className="text-center text-gray-300 mb-6 text-lg">
          Sign in to your account to continue
        </p>
        <input
          name="identifier"
          placeholder="Email or Phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className="w-full p-3 rounded-lg bg-gray-800 text-white border border-purple-700 focus:ring-2 focus:ring-purple-400 outline-none transition"
        />
        <input
          name="password"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 rounded-lg bg-gray-800 text-white border border-purple-700 focus:ring-2 focus:ring-purple-400 outline-none transition"
        />
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-xl font-semibold text-white shadow-lg hover:from-yellow-400 hover:to-pink-500 hover:scale-105 transition-all duration-300"
        >
          Login
        </button>
        <p className="text-lg text-center mt-4 text-gray-300">
          Don't have an account?{' '}
          <a href="/register" className="text-blue-400 underline hover:text-yellow-300 transition">
            Register
          </a>
        </p>
      </form>
    </div>
  );
}