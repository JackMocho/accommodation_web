import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import MapComponent from '../components/MapComponent';
import Chat from '../components/Chat';
import bgImage from '../assets/image15.jpg';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [suspendedUsers, setSuspendedUsers] = useState([]);
  const [rentals, setRentals] = useState([]); // <-- THIS FIXES YOUR ERROR
  const [pendingRentals, setPendingRentals] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRental, setSelectedRental] = useState(null);
  const [searchTown, setSearchTown] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatUserId, setChatUserId] = useState(null);

  // Debug: Log the JWT token on every render
  console.log('JWT token in localStorage:', localStorage.getItem('token'));

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      setError('Failed to fetch users.');
    }
  };

  // Fetch pending users (approved=false)
  const fetchPendingUsers = async () => {
    try {
      const res = await api.get('/admin/pending-users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingUsers(res.data);
    } catch (err) {
      setError('Failed to fetch pending users.');
    }
  };

  // Fetch suspended users (suspended=true)
  const fetchSuspendedUsers = async () => {
    try {
      const res = await api.get('/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuspendedUsers(res.data.filter(u => u.suspended));
    } catch (err) {
      setError('Failed to fetch suspended users.');
    }
  };

  // Fetch rentals
  const fetchRentals = async () => {
    try {
      const res = await api.get('/admin/rentals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRentals(res.data);
    } catch (err) {
      setError('Failed to fetch rentals.');
    }
  };

  // Fetch pending rentals (approved=false)
  const fetchPendingRentals = async () => {
    try {
      const res = await api.get('/admin/rentals?approved=false', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingRentals(res.data);
    } catch (err) {
      setError('Failed to fetch pending rentals.');
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      setError('Failed to fetch stats.');
    }
  };

  // Approve user (set approved=true, suspended=false)
  const handleApproveUser = async (id) => {
    if (!token) {
      alert('Session expired. Please log in again.');
      return;
    }
    try {
      await api.post(
        `/admin/users/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('User approved');
      fetchPendingUsers();
      fetchUsers();
      fetchSuspendedUsers();
    } catch (err) {
      alert(
        err.response?.data?.error === 'Token is not valid'
          ? 'Session expired or unauthorized. Please log in as admin.'
          : 'Failed to approve user.'
      );
    }
  };

  // Suspend user (set suspended=true, approved=false)
  const handleSuspendUser = async (id) => {
    try {
      await api.post(`/admin/users/${id}/suspend`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('User suspended');
      fetchUsers();
      fetchSuspendedUsers();
      fetchPendingUsers();
    } catch (err) {
      setError('Failed to suspend user.');
    }
  };

  // Delete user
  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('User deleted');
      fetchUsers();
      fetchPendingUsers();
      fetchSuspendedUsers();
    } catch (err) {
      setError('Failed to delete user.');
    }
  };

  // Delete rental
  const handleDeleteRental = async (id) => {
    try {
      await api.delete(`/admin/rental/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Rental deleted');
      fetchRentals();
    } catch (err) {
      setError('Failed to delete rental.');
    }
  };

  // Approve rental (set approved=true)
  const handleApproveRental = async (id) => {
    try {
      await api.patch(`/admin/rental/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Rental approved');
      fetchPendingRentals();
      fetchRentals();
    } catch (err) {
      setError('Failed to approve rental.');
    }
  };

  // Promote user to admin
  const handlePromoteToAdmin = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role: 'admin' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('User promoted to admin');
      fetchUsers();
    } catch (err) {
      setError('Failed to promote user.');
    }
  };

  // Chat: Fetch messages with selected user
  const fetchMessages = async (userId) => {
    try {
      const res = await api.get(`/chat/admin/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatInput('');
      fetchMessages(selectedUser);
    } catch (err) {
      setChatError('Failed to send message.');
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchUsers();
    fetchPendingUsers();
    fetchSuspendedUsers();
    fetchRentals();
    fetchStats();
    fetchPendingRentals();
  }, [user, token]);

  // Swap coordinates for all rentals for Leaflet ([lat, lng])
  const rentalsWithLatLng = rentals
    .filter(r => r.location && Array.isArray(r.location.coordinates))
    .map(r => ({
      ...r,
      location: {
        ...r.location,
        coordinates: [
          r.location.coordinates[0], // lat
          r.location.coordinates[1], // lng
        ],
      },
    }));

  // Search/filter rentals by town
  const filteredRentals = rentals.filter(r =>
    searchTown.trim() === ''
      ? true
      : (r.town && r.town.toLowerCase().includes(searchTown.trim().toLowerCase()))
  );

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-purple-900 to-blue-700 z-0"></div>
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        <h1 className="text-4xl font-extrabold mb-8 text-white text-center drop-shadow-lg tracking-wide">
          Admin Dashboard
        </h1>
        {error && <div className="bg-red-700/90 text-white p-2 rounded mb-4 shadow">{error}</div>}
        {success && <div className="bg-green-700/90 text-white p-2 rounded mb-4 shadow">{success}</div>}

        {/* Stats */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">System Stats</h2>
          <div className="flex gap-8 justify-center">
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-6 py-4 text-lg text-white shadow">
              <span className="font-bold text-yellow-300">{stats.totalUsers || 0}</span> Users
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-6 py-4 text-lg text-white shadow">
              <span className="font-bold text-green-300">{stats.totalRentals || 0}</span> Rentals
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-6 py-4 text-lg text-white shadow">
              <span className="font-bold text-blue-300">{stats.activeRentals || 0}</span> Active
            </div>
          </div>
        </section>

        {/* Pending Users */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">Pending Users</h2>
          <div className="overflow-x-auto rounded-lg shadow-lg">
            <table className="w-full table-auto bg-white/10 backdrop-blur-md rounded text-white">
              <thead>
                <tr className="bg-purple-900/80">
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-4 text-gray-200">No pending users.</td>
                  </tr>
                ) : (
                  pendingUsers.map(u => (
                    <tr key={u.id} className="hover:bg-purple-800/40 transition">
                      <td className="p-2">{u.full_name || u.name}</td>
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">{u.phone}</td>
                      <td className="p-2">{u.role}</td>
                      <td className="p-2">
                        <button onClick={() => handleApproveUser(u.id)} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded mr-2 text-white shadow transition">Approve</button>
                        <button onClick={() => handleDeleteUser(u.id)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white shadow transition">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>


        {/* Pending Rentals Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">Pending Rentals</h2>
          <div className="overflow-x-auto rounded-lg shadow-lg">
            <table className="w-full table-auto bg-white/10 backdrop-blur-md rounded text-white">
              <thead>
                <tr className="bg-purple-900/80">
                  <th className="p-2">Title</th>
                  <th className="p-2">Town</th>
                  <th className="p-2">Owner</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingRentals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center p-4 text-gray-200">No pending rentals.</td>
                  </tr>
                ) : (
                  pendingRentals.map(r => (
                    <tr key={r.id} className="hover:bg-purple-800/40 transition">
                      <td className="p-2">{r.title}</td>
                      <td className="p-2">{r.town}</td>
                      <td className="p-2">{r.owner_name || r.owner_id}</td>
                      <td className="p-2">
                        <button onClick={() => handleApproveRental(r.id)} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded mr-2 text-white shadow transition">Approve</button>
                        <button onClick={() => handleDeleteRental(r.id)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white shadow transition">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Suspended Users */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">Suspended Users</h2>
          <div className="overflow-x-auto rounded-lg shadow-lg">
            <table className="w-full table-auto bg-white/10 backdrop-blur-md rounded text-white">
              <thead>
                <tr className="bg-yellow-900/80">
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {suspendedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-4 text-gray-200">No suspended users.</td>
                  </tr>
                ) : (
                  suspendedUsers.map(u => (
                    <tr key={u.id} className="hover:bg-yellow-800/40 transition">
                      <td className="p-2">{u.full_name || u.name}</td>
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">{u.phone}</td>
                      <td className="p-2">{u.role}</td>
                      <td className="p-2">
                        {/* Optionally add unsuspend logic here */}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* All Users */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">All Users</h2>
          <div className="overflow-x-auto rounded-lg shadow-lg">
            <table className="w-full table-auto bg-white/10 backdrop-blur-md rounded text-white">
              <thead>
                <tr className="bg-blue-900/80">
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Town</th>
                  <th className="p-2">Action</th>
                  <th className="p-2">Chat</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-4 text-gray-200">No users found.</td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-blue-800/40 transition">
                      <td className="p-2">{u.full_name || u.name}</td>
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">{u.phone}</td>
                      <td className="p-2">{u.role}</td>
                      <td className="p-2">{u.town}</td>
                      <td className="p-2">
                        <button onClick={() => handleSuspendUser(u.id)} className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded mr-2 text-white shadow transition">Suspend</button>
                        <button onClick={() => handleDeleteUser(u.id)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded mr-2 text-white shadow transition">Delete</button>
                        {u.role !== 'admin' && (
                          <button onClick={() => handlePromoteToAdmin(u.id)} className="bg-purple-700 hover:bg-purple-800 px-3 py-1 rounded text-white shadow transition">Make Admin</button>
                        )}
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => {
                            setShowChat(true);
                            setChatUserId(u.id);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white shadow transition"
                        >
                          Chat
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Rentals */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">All Rentals</h2>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <input
              type="text"
              value={searchTown}
              onChange={e => setSearchTown(e.target.value)}
              placeholder="Search by town..."
              className="bg-white/20 text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="overflow-x-auto rounded-lg shadow-lg">
            <table className="w-full table-auto bg-white/10 backdrop-blur-md rounded text-white">
              <thead>
                <tr className="bg-green-900/80">
                  <th className="p-2">Title</th>
                  <th className="p-2">Town</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRentals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-4 text-gray-200">No rentals found.</td>
                  </tr>
                ) : (
                  filteredRentals.map(r => (
                    <tr key={r.id} className="hover:bg-green-800/40 transition">
                      <td className="p-2">
                        <button
                          className="underline text-blue-300 hover:text-blue-500 transition"
                          onClick={() => setSelectedRental(r)}
                        >
                          {r.title}
                        </button>
                      </td>
                      <td className="p-2">{r.town}</td>
                      <td className="p-2">
                        {r.mode === 'lodging'
                          ? `KES ${r.nightly_price}/night`
                          : `KES ${r.price}/month`}
                      </td>
                      <td className="p-2">{r.status}</td>
                      <td className="p-2">
                        <button onClick={() => handleDeleteRental(r.id)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white shadow transition">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        

        {/* Rental detail modal with map */}
        {selectedRental && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative text-black">
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl"
                onClick={() => setSelectedRental(null)}
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold mb-2">{selectedRental.title}</h2>
              <p className="mb-2"><strong>Town:</strong> {selectedRental.town}</p>
              <div className="mb-4">
                <strong>Status:</strong> {selectedRental.status}
              </div>
              <div className="mb-4">
                <MapComponent
                  rentals={[selectedRental]}
                  height="h-64 md:h-96"
                />
              </div>
            </div>
          </div>
        )}

        {/* Chat Section */}
        {selectedUser && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">Chat with User</h2>
            {chatError && <div className="bg-red-700 text-white p-2 rounded mb-2">{chatError}</div>}
            <div className="bg-gray-900/80 rounded p-4 mb-2 max-h-64 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-gray-300">No messages yet.</div>
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

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-center text-white">All Rental & Lodging Locations</h2>
          {rentalsWithLatLng.length === 0 ? (
            <p className="text-gray-300 text-center">No rentals or lodgings with location data.</p>
          ) : (
            <div className="w-full h-96 mb-8 rounded overflow-hidden shadow-lg">
              <MapComponent rentals={rentalsWithLatLng} height="h-96" />
            </div>
          )}
        </section>

        {/* Chat Modal */}
        {showChat && chatUserId && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative">
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl"
                onClick={() => setShowChat(false)}
              >
                &times;
              </button>
              <Chat
                userId={user.id}
                adminUserId={user.id}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}