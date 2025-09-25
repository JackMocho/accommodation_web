import React, { useState } from 'react';
import api from '../utils/api';
import useAutoLocation from '../hooks/useAutoLocation';
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/image24.jpg';

export default function Register() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client', // must be one of: client, landlord, admin
    town: '',
    latitude: '',
    longitude: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();

  useAutoLocation(
    (lat) => setForm((f) => ({ ...f, latitude: lat })),
    (lng) => setForm((f) => ({ ...f, longitude: lng }))
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleGeolocate = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm((f) => ({
            ...f,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }));
          localStorage.setItem('userLat', pos.coords.latitude);
          localStorage.setItem('userLng', pos.coords.longitude);
        },
        () => alert('Could not get your location')
      );
    } else {
      alert('Geolocation not supported in this browser');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // require full_name, email, password, phone and role
    if (
      !form.full_name?.trim() ||
      !form.email?.trim() ||
      !form.password?.trim() ||
      !form.confirmPassword?.trim() ||
      !form.phone?.trim() ||
      !form.role?.trim()
    ) {
      return alert('Please provide Full Name, Email, Password, Confirm Password, Phone and Role.');
    }

    if (form.password !== form.confirmPassword) {
      return alert('Passwords do not match.');
    }

    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        role: form.role,
        town: form.town || undefined,
        latitude:
          form.latitude === '' || form.latitude === undefined
            ? undefined
            : Number(form.latitude),
        longitude:
          form.longitude === '' || form.longitude === undefined
            ? undefined
            : Number(form.longitude),
      };

      const res = await api.post('/auth/register', payload);
      alert(res.data?.message || 'Registration successful!');

      navigate('/login');
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      console.error('Registration error response:', err.response || err);
      alert(`Registration failed: ${serverMsg || err.message}`);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${bgImage})`,
          filter: 'brightness(0.45) blur(2px)',
        }}
        aria-hidden="true"
      ></div>
      {/* Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none"></div>

      <form
        onSubmit={handleRegister}
        className="relative z-20 backdrop-blur-md p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-lg space-y-6 border-2 border-purple-700"
      >
        <h2 className="text-4xl font-extrabold text-center mb-4 text-white drop-shadow-lg">
          Create Your Account
        </h2>
        <p className="text-center text-gray-300 mb-6 text-lg">
          Join our vibrant rental community today!
        </p>

        <input
          name="full_name"
          type="text"
          value={form.full_name}
          onChange={handleChange}
          placeholder="Full Name"
          required
          className="w-full p-3 rounded-lg bg-gray-800 text-white border border-purple-700 focus:ring-2 focus:ring-purple-400 outline-none transition"
        />

        <input
          name="email"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full p-3 rounded-lg bg-gray-800 text-white border border-purple-700 focus:ring-2 focus:ring-purple-400 outline-none transition"
        />

        <input
          name="phone"
          placeholder="Phone Number"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          required
          className="w-full p-3 rounded-lg bg-gray-800 text-white border border-purple-700 focus:ring-2 focus:ring-purple-400 outline-none transition"
        />

        {/* Password Field with Show/Hide */}
        <div className="relative">
          <input
            name="password"
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-purple-700 focus:ring-2 focus:ring-purple-400 outline-none transition pr-16"
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-yellow-300 transition"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Confirm Password Field with Show/Hide */}
        <div className="relative">
          <input
            name="confirmPassword"
            placeholder="Confirm Password"
            type={showConfirm ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-purple-700 focus:ring-2 focus:ring-purple-400 outline-none transition pr-16"
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-yellow-300 transition"
            onClick={() => setShowConfirm((v) => !v)}
          >
            {showConfirm ? 'Hide' : 'Show'}
          </button>
        </div>

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          required
          className="w-full p-3 rounded-lg bg-gray-800 text-white border border-purple-700 focus:ring-2 focus:ring-purple-400 outline-none transition"
        >
          <option value="client">Client</option>
          <option value="landlord">Landlord / Caretaker</option>
          <option value="admin">Admin (for demo only)</option>
        </select>

        <input
          type="text"
          name="town"
          placeholder="Town"
          value={form.town}
          onChange={handleChange}
          className="p-3 rounded-lg bg-gray-800 text-white w-full border border-purple-700 focus:ring-2 focus:ring-purple-400 outline-none transition"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            type="number"
            name="latitude"
            placeholder="Latitude"
            value={form.latitude}
            onChange={handleChange}
            className="p-3 rounded-lg bg-gray-800 text-white w-full border border-purple-700 focus:ring-2 focus:ring-purple-400 outline-none transition"
            step="any"
          />
          <input
            type="number"
            name="longitude"
            placeholder="Longitude"
            value={form.longitude}
            onChange={handleChange}
            className="p-3 rounded-lg bg-gray-800 text-white w-full border border-purple-700 focus:ring-2 focus:ring-purple-400 outline-none transition"
            step="any"
          />
        </div>

        <button
          type="button"
          onClick={handleGeolocate}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-white font-semibold shadow transition"
        >
          Use My Location
        </button>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-green-600 to-purple-600 hover:from-yellow-400 hover:to-pink-500 text-white py-3 rounded-lg text-xl font-bold shadow-lg hover:scale-105 transition-all duration-300"
        >
          Register
        </button>

        <p className="mt-4 text-center text-lg text-gray-300">
          Already have an account?{' '}
          <a href="/login" className="text-blue-400 underline hover:text-yellow-300 transition">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}