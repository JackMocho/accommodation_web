import React, { useState } from 'react';
import api from '../utils/api';
import useAutoLocation from '../hooks/useAutoLocation';

export default function Register() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'client',
    town: '',
    latitude: '',
    longitude: '',
    phone: '',
  });

  useAutoLocation(
    (lat) => setForm(f => ({ ...f, latitude: lat })),
    (lng) => setForm(f => ({ ...f, longitude: lng }))
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGeolocate = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm(f => ({
            ...f,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }));
          localStorage.setItem('userLat', pos.coords.latitude);
          localStorage.setItem('userLng', pos.coords.longitude);
        },
        () => alert('Could not get your location')
      );
    }
  };

  // Example registration handler
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        full_name: form.full_name, // <-- must be present!
        phone: form.phone,     // optional
        role: form.role,      // optional
        town: form.town,      // optional
        latitude: form.latitude,  // optional
        longitude: form.longitude, // optional
      });
      alert('Registration successful! Awaiting approval.');
      window.location.href = '/login';
    } catch (err) {
      console.error('Registration failed:', err.response?.data || err.message);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900 px-2">
      <form
        onSubmit={handleRegister}
        className="bg-gray-800 p-6 md:p-10 rounded shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-bold mb-4 text-center">Register</h2>

        <input
          type="text"
          value={form.full_name}
          onChange={e => setForm({ ...form, full_name: e.target.value })}
          placeholder="Full Name"
          required
          className="w-full"
        />

        <input
          name="email"
          placeholder="Email (optional)"
          type="email"
          onChange={handleChange}
          className="w-full"
        />

        <input
          name="phone"
          placeholder="Phone Number"
          type="tel"
          onChange={handleChange}
          className="w-full"
          required
        />

        <input
          name="password"
          placeholder="Password"
          type="password"
          onChange={handleChange}
          required
          className="w-full"
        />

        <select
          name="role"
          onChange={handleChange}
          className="w-full"
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
          className="p-2 rounded bg-gray-700 text-white w-full"
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            type="number"
            name="latitude"
            placeholder="Latitude"
            value={form.latitude}
            onChange={handleChange}
            className="p-2 rounded-xl bg-gray-700 text-white w-full"
            required
          />
          <input
            type="number"
            name="longitude"
            placeholder="Longitude"
            value={form.longitude}
            onChange={handleChange}
            className="p-2 rounded-xl bg-gray-700 text-white w-full"
            required
          />
        </div>
        <button
          type="button"
          onClick={handleGeolocate}
          className="mt-2 w-full bg-blue-600 px-3 py-2 rounded text-white"
        >
          Use My Location
        </button>

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
        >
          Register
        </button>

        <p className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-blue-400 underline">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}