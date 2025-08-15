import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  // Change password state
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // Fetch user info from backend on mount
  useEffect(() => {
    const fetchUser = async () => {
      if (!user?.id) return;
      try {
        const res = await api.get(`/users/${user.id}`);
        setForm({
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
        });
      } catch {
        setError('Failed to fetch user info.');
      }
      setLoading(false);
    };
    fetchUser();
  }, [user?.id]);

  // Handle phone update (clients and landlords only)
  const handlePhoneChange = e => {
    setForm({ ...form, phone: e.target.value });
  };
  const handlePhoneUpdate = async e => {
    e.preventDefault();
    setSuccess('');
    setError('');
    try {
      const res = await api.put(`/users/${user.id}`, { phone: form.phone });
      setSuccess('Phone number updated!');
      setForm(f => ({ ...f, phone: res.data.phone }));
    } catch {
      setError('Failed to update phone number.');
    }
  };

  // Handle password change (all users)
  const handlePasswordChange = e => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };
  const handlePasswordSubmit = async e => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (passwords.new !== passwords.confirm) {
      setPwError('New passwords do not match.');
      return;
    }
    try {
      await api.post(`/users/${user.id}/change-password`, {
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      setPwSuccess('Password changed successfully!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      setPwError(
        err.response?.data?.error || 'Failed to change password.'
      );
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-gray-800 p-8 rounded shadow text-white text-center">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-12 bg-gray-800 p-8 rounded shadow text-white">
      {/* Profile Section */}
      <h2 className="text-2xl font-bold mb-6">My Profile</h2>
      {error && <div className="mb-4 p-2 bg-red-700 rounded">{error}</div>}
      {success && <div className="mb-4 p-2 bg-green-700 rounded">{success}</div>}
      <div className="space-y-4 mb-10">
        <div>
          <label className="block mb-1 text-gray-300">Name</label>
          <input
            name="name"
            value={form.name}
            className="w-full p-2 rounded bg-gray-700 text-white"
            readOnly
          />
        </div>
        <div>
          <label className="block mb-1 text-gray-300">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            className="w-full p-2 rounded bg-gray-700 text-white"
            readOnly
          />
        </div>
        <div>
          <label className="block mb-1 text-gray-300">Phone</label>
          {['client', 'landlord'].includes(user?.role) ? (
            <form onSubmit={handlePhoneUpdate} className="flex gap-2">
              <input
                name="phone"
                value={form.phone}
                onChange={handlePhoneChange}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
              <button
                type="submit"
                className="bg-blue-700 px-4 py-2 rounded text-white"
              >
                Update
              </button>
            </form>
          ) : (
            <input
              name="phone"
              value={form.phone}
              className="w-full p-2 rounded bg-gray-700 text-white"
              readOnly
            />
          )}
        </div>
      </div>

      {/* Change Password Section */}
      <div className="mt-10">
        <h3 className="text-xl font-bold mb-4">Change Password</h3>
        {pwError && <div className="mb-2 p-2 bg-red-700 rounded">{pwError}</div>}
        {pwSuccess && <div className="mb-2 p-2 bg-green-700 rounded">{pwSuccess}</div>}
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div>
            <label className="block mb-1 text-gray-300">Current Password</label>
            <input
              name="current"
              type={showPassword ? 'text' : 'password'}
              value={passwords.current}
              onChange={handlePasswordChange}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-300">New Password</label>
            <input
              name="new"
              type={showPassword ? 'text' : 'password'}
              value={passwords.new}
              onChange={handlePasswordChange}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-300">Confirm New Password</label>
            <input
              name="confirm"
              type={showPassword ? 'text' : 'password'}
              value={passwords.confirm}
              onChange={handlePasswordChange}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(v => !v)}
              id="showpw"
            />
            <label htmlFor="showpw" className="text-gray-300 text-sm">Show Passwords</label>
          </div>
          <button
            type="submit"
            className="bg-purple-700 hover:bg-purple-600 px-6 py-2 rounded text-white font-semibold transition"
          >
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}