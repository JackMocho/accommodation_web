import React, { useState } from 'react';
import api from '../utils/api';
import useAutoLocation from '../hooks/useAutoLocation';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'client', // must be one of: client, landlord, admin
    town: '',
    latitude: '',
    longitude: '',
    phone: '',
  });

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
      !form.phone?.trim() ||
      !form.role?.trim()
    ) {
      return alert('Please provide Full Name, Email, Password, Phone and Role.');
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
      // improved error reporting: try to show backend message
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      console.error('Registration error response:', err.response || err);
      alert(`Registration failed: ${serverMsg || err.message}`);
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
          name="full_name"
          type="text"
          value={form.full_name}
          onChange={handleChange}
          placeholder="Full Name"
          required
          className="w-full"
        />

        <input
          name="email"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full"
        />

        <input
          name="phone"
          placeholder="Phone Number"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          required
          className="w-full"
        />

        <input
          name="password"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full"
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          required
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
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            type="number"
            name="latitude"
            placeholder="Latitude"
            value={form.latitude}
            onChange={handleChange}
            className="p-2 rounded-xl bg-gray-700 text-white w-full"
            step="any"
          />
          <input
            type="number"
            name="longitude"
            placeholder="Longitude"
            value={form.longitude}
            onChange={handleChange}
            className="p-2 rounded-xl bg-gray-700 text-white w-full"
            step="any"
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