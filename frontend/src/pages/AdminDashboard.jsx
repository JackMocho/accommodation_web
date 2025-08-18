import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user, token: contextToken } = useAuth();
  const token = contextToken || localStorage.getItem('token');
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [suspendedUsers, setSuspendedUsers] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Chat state
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');

  // Helper for auth headers
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users', authHeaders);
      setUsers(res.data);
    } catch (err) {
      setError('Failed to fetch users.');
    }
  };

  // Fetch pending users
  const fetchPendingUsers = async () => {
    try {
      const res = await api.get('/admin/pending-users', authHeaders);
      setPendingUsers(res.data);
    } catch (err) {
      setError('Failed to fetch pending users.');
    }
  };

  // Fetch suspended users
  const fetchSuspendedUsers = async () => {
    try {
      const res = await api.get('/admin/users', authHeaders);
      setSuspendedUsers(res.data.filter(u => u.suspended));
    } catch (err) {
      setError('Failed to fetch suspended users.');
    }
  };

  // Fetch rentals
  const fetchRentals = async () => {
    try {
      const res = await api.get('/admin/rentals', authHeaders);
      setRentals(res.data);
    } catch (err) {
      setError('Failed to fetch rentals.');
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats', authHeaders);
      setStats(res.data);
    } catch (err) {
      setError('Failed to fetch stats.');
    }
  };

  // Approve user
  const handleApproveUser = async (id) => {
    try {
      await api.put(
        `/admin/approve-user/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('User approved');
      fetchPendingUsers();
      fetchUsers();
    } catch (err) {
      setError('Failed to approve user.');
    }
  };

  // Suspend user
  const handleSuspendUser = async (id) => {
    try {
      await api.put(`/admin/user/${id}/suspend`, {}, authHeaders);
      setSuccess('User suspended');
      fetchUsers();
      fetchSuspendedUsers();
    } catch (err) {
      setError('Failed to suspend user.');
    }
  };

  // Delete user
  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`/admin/user/${id}`, authHeaders);
      setSuccess('User deleted');
      fetchUsers();
      fetchPendingUsers();
    } catch (err) {
      setError('Failed to delete user.');
    }
  };

  // Delete rental
  const handleDeleteRental = async (id) => {
    try {
      await api.delete(`/admin/rental/${id}`, authHeaders);
      setSuccess('Rental deleted');
      fetchRentals();
    } catch (err) {
      setError('Failed to delete rental.');
    }
  };

  // Promote user to admin
  const handlePromoteToAdmin = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role: 'admin' }, authHeaders);
      setSuccess('User promoted to admin');
      fetchUsers();
    } catch (err) {
      setError('Failed to promote user.');
    }
  };

  // Chat: Fetch messages with selected user
  const fetchMessages = async (userId) => {
    try {
      const res = await api.get(`/chat/admin/${userId}`, authHeaders);
      setMessages(res.data);
      setSelectedUser(userId);
      setChatError('');
    } catch (err) {
      setChatError('Failed to fetch messages.');
    }
  };

  // Chat: Send message to selected user
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedUser) return;
    try {
      await api.post('/chat/admin/send', {
        to: selectedUser,
        message: chatInput,
      }, authHeaders);
      setChatInput('');
      fetchMessages(selectedUser);
    } catch (err) {
      setChatError('Failed to send message.');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPendingUsers();
    fetchSuspendedUsers();
    fetchRentals();
    fetchStats();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-blue-800 to-purple-900 text-white">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      {error && <div className="bg-red-700 text-white p-2 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-700 text-white p-2 rounded mb-4">{success}</div>}

      {/* Stats */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">System Stats</h2>
        <div className="flex gap-8">
          <div>Total Users: {stats.totalUsers || 0}</div>
          <div>Total Rentals: {stats.totalRentals || 0}</div>
          <div>Active Rentals: {stats.activeRentals || 0}</div>
        </div>
      </section>

      {/* Pending Users */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Pending Users</h2>
        <table className="w-full table-auto bg-gray-800 rounded">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.length === 0 ? (
              <tr><td colSpan={5}>No pending users.</td></tr>
            ) : (
              pendingUsers.map(u => (
                <tr key={u.id}>
                  <td>{u.full_name || u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>{u.role}</td>
                  <td>
                    <button onClick={() => handleApproveUser(u.id)} className="bg-green-600 px-2 py-1 rounded mr-2">Approve</button>
                    <button onClick={() => handleDeleteUser(u.id)} className="bg-red-600 px-2 py-1 rounded">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Suspended Users */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Suspended Users</h2>
        <table className="w-full table-auto bg-gray-800 rounded">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {suspendedUsers.length === 0 ? (
              <tr><td colSpan={5}>No suspended users.</td></tr>
            ) : (
              suspendedUsers.map(u => (
                <tr key={u.id}>
                  <td>{u.full_name || u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>{u.role}</td>
                  <td>
                    <button onClick={() => handleApproveUser(u.id)} className="bg-green-600 px-2 py-1 rounded mr-2">Approve</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* All Users */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">All Users</h2>
        <table className="w-full table-auto bg-gray-800 rounded">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Town</th><th>Action</th>
              <th>Chat</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={7}>No users found.</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id}>
                  <td>{u.full_name || u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>{u.role}</td>
                  <td>{u.town}</td>
                  <td>
                    <button onClick={() => handleSuspendUser(u.id)} className="bg-yellow-600 px-2 py-1 rounded mr-2">Suspend</button>
                    <button onClick={() => handleDeleteUser(u.id)} className="bg-red-600 px-2 py-1 rounded mr-2">Delete</button>
                    {u.role !== 'admin' && (
                      <button onClick={() => handlePromoteToAdmin(u.id)} className="bg-purple-700 px-2 py-1 rounded">Make Admin</button>
                    )}
                  </td>
                  <td>
                    <button onClick={() => fetchMessages(u.id)} className="bg-blue-600 px-2 py-1 rounded">Chat</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Rentals */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">All Rentals</h2>
        <table className="w-full table-auto bg-gray-800 rounded">
          <thead>
            <tr>
              <th>Title</th><th>Description</th><th>Price</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rentals.length === 0 ? (
              <tr><td colSpan={5}>No rentals found.</td></tr>
            ) : (
              rentals.map(r => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.description}</td>
                  <td>{r.price}</td>
                  <td>{r.status}</td>
                  <td>
                    <button onClick={() => handleDeleteRental(r.id)} className="bg-red-600 px-2 py-1 rounded">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Chat Section */}
      {selectedUser && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Chat with User</h2>
          {chatError && <div className="bg-red-700 text-white p-2 rounded mb-2">{chatError}</div>}
          <div className="bg-gray-900 rounded p-4 mb-2 max-h-64 overflow-y-auto">
            {messages.length === 0 ? (
              <div>No messages yet.</div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`mb-2 ${msg.from === user.id ? 'text-right' : 'text-left'}`}>
                  <span className="inline-block px-3 py-2 rounded bg-blue-700 text-white">
                    {msg.message}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">{new Date(msg.created_at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 rounded bg-gray-800 text-white"
            />
            <button type="submit" className="bg-blue-600 px-4 py-2 rounded text-white">Send</button>
            <button type="button" className="bg-gray-600 px-4 py-2 rounded text-white" onClick={() => { setSelectedUser(null); setMessages([]); }}>Close</button>
          </form>
        </section>
      )}
    </div>
  );
}