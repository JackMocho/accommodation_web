import React, { useState } from 'react';
import api from '../utils/api';
import useAutoLocation from '../hooks/useAutoLocation';
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/image1.jpg'; // Use the new captivating background

export default function Register() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client',
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
      {/* Background image with captivating overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${bgImage})`,
        }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/70 via-black/60 to-yellow-700/60 backdrop-blur-sm"></div>
      </div>
      {/* Overlay for extra depth */}
      <div className="absolute inset-0 z-10 pointer-events-none"></div>

      <form
        onSubmit={handleRegister}
        className="relative z-20 backdrop-blur-xl bg-white/10 p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-lg space-y-8 border-2 border-yellow-400"
      >
        <h2 className="text-5xl font-extrabold text-center mb-4 text-yellow-300 drop-shadow-xl tracking-wide">
          Join Rentals Today
        </h2>
        <p className="text-center text-purple-100 mb-8 text-lg font-medium">
          Discover your next home or list your property with ease!
        </p>

        <input
          name="full_name"
          type="text"
          value={form.full_name}
          onChange={handleChange}
          placeholder="Full Name"
          required
          className="w-full p-4 rounded-xl bg-gray-900/80 text-yellow-100 border-2 border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition shadow-lg"
        />

        <input
          name="email"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full p-4 rounded-xl bg-gray-900/80 text-yellow-100 border-2 border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition shadow-lg"
        />

        <input
          name="phone"
          placeholder="Phone Number"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          required
          className="w-full p-4 rounded-xl bg-gray-900/80 text-yellow-100 border-2 border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition shadow-lg"
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
            className="w-full p-4 rounded-xl bg-gray-900/80 text-yellow-100 border-2 border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition pr-16 shadow-lg"
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-400 hover:text-purple-300 transition font-bold"
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
            className="w-full p-4 rounded-xl bg-gray-900/80 text-yellow-100 border-2 border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition pr-16 shadow-lg"
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-400 hover:text-purple-300 transition font-bold"
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
          className="w-full p-4 rounded-xl bg-gray-900/80 text-yellow-100 border-2 border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition shadow-lg"
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
          className="p-4 rounded-xl bg-gray-900/80 text-yellow-100 w-full border-2 border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition shadow-lg"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            name="latitude"
            placeholder="Latitude"
            value={form.latitude}
            onChange={handleChange}
            className="p-4 rounded-xl bg-gray-900/80 text-yellow-100 w-full border-2 border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition shadow-lg"
            step="any"
          />
          <input
            type="number"
            name="longitude"
            placeholder="Longitude"
            value={form.longitude}
            onChange={handleChange}
            className="p-4 rounded-xl bg-gray-900/80 text-yellow-100 w-full border-2 border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition shadow-lg"
            step="any"
          />
        </div>

        <button
          type="button"
          onClick={handleGeolocate}
          className="mt-2 w-full bg-gradient-to-r from-purple-700 via-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-purple-700 px-3 py-3 rounded-xl text-white font-semibold shadow-xl transition-all duration-300"
        >
          Use My Location
        </button>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-yellow-400 via-purple-600 to-purple-900 hover:from-purple-700 hover:to-yellow-400 text-white py-4 rounded-2xl text-2xl font-extrabold shadow-2xl hover:scale-105 transition-all duration-300 mt-4"
        >
          Register
        </button>

        <p className="mt-6 text-center text-lg text-yellow-100">
          Already have an account?{' '}
          <a href="/login" className="text-purple-300 underline hover:text-yellow-400 transition font-bold">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}