import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ChatInbox from '../components/ChatInbox';
import RentalCard from '../components/RentalCard';
import Chat from '../components/Chat';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MapComponent from '../components/MapComponent';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import L from 'leaflet';

export default function AdminDashboard() {
  const { user, token: contextToken } = useAuth();
  const token = contextToken || localStorage.getItem('token');
  const [pendingClients, setPendingClients] = useState([]);
  const [pendingLandlords, setPendingLandlords] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedTown, setSelectedTown] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showAdminChat, setShowAdminChat] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [suspendedUsers, setSuspendedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [allChats, setAllChats] = useState([]);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [criticalError, setCriticalError] = useState('');
  const adminUserId = user?.id;

  // Custom marker icons for available and booked
  const availableIcon = new L.Icon({
    iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
    className: 'marker-available'
  });

  const bookedIcon = new L.Icon({
    iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon-red.png',
    iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
    className: 'marker-booked'
  });

  // Helper to handle and display errors
  const handleError = (err, fallbackMsg = 'An error occurred.') => {
    let msg = fallbackMsg;
    if (err?.response?.data?.error) msg = err.response.data.error;
    else if (err?.message) msg = err.message;
    setCriticalError(msg);
    setError(msg);
    setLoading(false);
  };

  // Fetch pending users (not approved, not suspended)
  const fetchPendingUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/pending-users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const users = Array.isArray(res.data) ? res.data : res.data.users || [];
      setPendingClients(users.filter(u => u.role === 'client'));
      setPendingLandlords(users.filter(u => u.role === 'landlord'));
    } catch (err) {
      handleError(err, 'Failed to load pending users.');
    }
  };

  // Fetch approved users (approved, not suspended)
  const fetchApprovedUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const users = Array.isArray(res.data) ? res.data : res.data.users || [];
      setApprovedUsers(users.filter(u => u.approved && !u.suspended));
    } catch (err) {
      handleError(err, 'Failed to load approved users.');
    }
  };

  // Fetch suspended users
  const fetchSuspendedUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const users = Array.isArray(res.data) ? res.data : res.data.users || [];
      setSuspendedUsers(users.filter(u => u.suspended));
    } catch (err) {
      handleError(err, 'Failed to load suspended users.');
    }
  };

  // Approve user
  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this user?')) return;
    try {
      await axios.put(
        `http://localhost:5000/api/admin/approve-user/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPendingUsers();
      fetchApprovedUsers();
      setSuccess('User approved');
    } catch (err) {
      handleError(err, 'Approval failed. Try again.');
    }
  };

  // Approve suspended user
  const handleApproveSuspended = async (id) => {
    if (!window.confirm('Approve this suspended user?')) return;
    try {
      await axios.put(`http://localhost:5000/api/admin/user/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuspendedUsers(users => users.filter(u => u.id !== id));
      fetchApprovedUsers();
      setSuccess('User approved');
    } catch (err) {
      handleError(err, 'Failed to approve user');
    }
  };

  // Suspend user
  const handleSuspend = async (id) => {
    if (!window.confirm('Suspend this user?')) return;
    try {
      await axios.put(`http://localhost:5000/api/admin/user/${id}/suspend`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchApprovedUsers();
      setSuccess('User suspended');
    } catch (err) {
      handleError(err, 'Failed to suspend user.');
    }
  };

  // Delete user
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchApprovedUsers();
      fetchPendingUsers();
      setSuccess('User deleted successfully');
    } catch (err) {
      handleError(err, 'Failed to delete user');
    }
  };

  // Delete rental
  const handleDeleteRental = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rental?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/rental/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRentals(rentals.filter(r => r.id !== id));
      setSuccess('Rental deleted successfully');
    } catch (err) {
      handleError(err, 'Failed to delete rental');
    }
  };

  // Fetch rentals
  const fetchRentals = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/rentals/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Normalize location if needed
      const rentalsData = res.data.map(r => {
        if (r.location_geojson && !r.location) {
          r.location = r.location_geojson;
        }
        return r;
      });
      setRentals(rentalsData);
    } catch (err) {
      handleError(err, 'Failed to load rentals.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const res = await axios.get(`http://localhost:5000/api/chat/messages/recent/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      setMessages([]);
      handleError(err, 'Failed to load messages.');
    }
  };

  // Fetch all users for management
  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(res.data);
    } catch (err) {
      setError('Failed to fetch users.');
      setCriticalError('Failed to fetch users.');
    }
  };

  // Promote user to admin
  const promoteToAdmin = async (userId) => {
    setSuccess('');
    setError('');
    try {
      await axios.patch(
        `http://localhost:5000/api/users/${userId}/role`,
        { role: 'admin' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setUsers(users =>
        users.map(u => (u.id === userId ? { ...u, role: 'admin' } : u))
      );
      setSuccess('User promoted to admin!');
    } catch (err) {
      setError('Failed to promote user.');
      setCriticalError('Failed to promote user.');
    }
  };

  // Fetch all chats for the admin
  const fetchAllChats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const chatUsers = [];
      for (const u of res.data) {
        if (u.id !== adminUserId) {
          const chatRes = await axios.get(
            `http://localhost:5000/api/chat/messages/admin/${adminUserId}/${u.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (chatRes.data.length > 0) {
            chatUsers.push({ ...u, lastMessage: chatRes.data[chatRes.data.length - 1] });
          }
        }
      }
      setAllChats(chatUsers);
    } catch (err) {
      setAllChats([]);
      handleError(err, 'Failed to load chats.');
    }
  };

  useEffect(() => {
    fetchPendingUsers();
    fetchApprovedUsers();
    fetchSuspendedUsers();
    fetchRentals();
    fetchMessages();
    fetchUsers();
    fetchAllChats();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (showAllMessages) fetchAllChats();
    // eslint-disable-next-line
  }, [showAllMessages]);

  // Town and role filter options
  const towns = Array.from(new Set(approvedUsers.map(u => u.town).filter(Boolean)));
  const roles = Array.from(new Set(approvedUsers.map(u => u.role).filter(Boolean)));

  // Filtered approved users
  const filteredUsers = approvedUsers.filter(u =>
    (selectedTown ? u.town === selectedTown : true) &&
    (selectedRole ? u.role === selectedRole : true)
  );

  // Rentals with location for map
  const rentalsWithLocation = rentals.filter(
    r =>
      r.location &&
      Array.isArray(r.location.coordinates) &&
      r.location.coordinates.length === 2 &&
      !isNaN(Number(r.location.coordinates[0])) &&
      !isNaN(Number(r.location.coordinates[1]))
  );

  // Filter rentals for property type
  const availableRentals = propertyType === 'all'
    ? rentals
    : rentals.filter(r => r.mode === propertyType);

  // Only show available and booked rentals
  const visibleRentals = availableRentals.filter(r => r.status === 'available' || r.status === 'booked');

  if (criticalError) {
    return (
      <div className="p-10 max-w-2xl mx-auto bg-red-900 text-white rounded shadow text-center">
        <h2 className="text-2xl font-bold mb-4">An error occurred</h2>
        <p className="mb-4">{criticalError}</p>
        <button
          className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-blue-800 to-purple-900 text-white">
      <h1 className="text-3xl font-bold mb-8">System administration.</h1>

      {/* Pending Clients */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Pending Clients</h2>
        <div className="overflow-x-auto bg-gray-800 rounded shadow overflow-hidden">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingClients.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-500">
                    No pending clients found.
                  </td>
                </tr>
              ) : (
                pendingClients.map(user => (
                  <tr key={user.id} className="border-t border-gray-700 hover:bg-gray-700">
                    <td className="px-4 py-2">{user.full_name}</td>
                    <td className="px-4 py-2">{user.email || 'N/A'}</td>
                    <td className="px-4 py-2">{user.phone || 'N/A'}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded ml-2"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pending Landlords */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Pending Landlords</h2>
        <div className="overflow-x-auto bg-gray-800 rounded shadow overflow-hidden">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingLandlords.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-500">
                    No pending landlords found.
                  </td>
                </tr>
              ) : (
                pendingLandlords.map(user => (
                  <tr key={user.id} className="border-t border-gray-700 hover:bg-gray-700">
                    <td className="px-4 py-2">{user.full_name}</td>
                    <td className="px-4 py-2">{user.email || 'N/A'}</td>
                    <td className="px-4 py-2">{user.phone || 'N/A'}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded ml-2"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Approved Users with Filters */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">All Approved Users</h2>
        <div className="mb-4 flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Town</label>
            <select
              value={selectedTown}
              onChange={e => setSelectedTown(e.target.value)}
              className="px-2 py-1 rounded bg-gray-700 text-white"
            >
              <option value="">All Towns</option>
              {towns.map(town => (
                <option key={town} value={town}>{town}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Role</label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="px-2 py-1 rounded bg-gray-700 text-white"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto bg-gray-800 rounded shadow overflow-hidden">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Town</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500">
                    No approved users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-t border-gray-700 hover:bg-gray-700">
                    <td className="px-4 py-2">{user.full_name}</td>
                    <td className="px-4 py-2">{user.email || 'N/A'}</td>
                    <td className="px-4 py-2">{user.phone || 'N/A'}</td>
                    <td className="px-4 py-2">{user.role || 'N/A'}</td>
                    <td className="px-4 py-2">{user.town || 'N/A'}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setShowAdminChat(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                      >
                        Chat
                      </button>
                      <button
                        onClick={() => handleSuspend(user.id)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
                      >
                        Suspend
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                      {user.superadmin && user.role !== 'admin' && (
                        <button
                          onClick={() => promoteToAdmin(user.id)}
                          className="bg-purple-700 hover:bg-purple-600 px-3 py-1 rounded text-white font-semibold transition"
                        >
                          Make Admin
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Suspended Users */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Suspended Users</h2>
        <div className="overflow-x-auto bg-gray-800 rounded shadow overflow-hidden">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Town</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {suspendedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500">
                    No suspended users found.
                  </td>
                </tr>
              ) : (
                suspendedUsers.map(user => (
                  <tr key={user.id} className="border-t border-gray-700 hover:bg-gray-700">
                    <td className="px-4 py-2">{user.full_name}</td>
                    <td className="px-4 py-2">{user.email || 'N/A'}</td>
                    <td className="px-4 py-2">{user.phone || 'N/A'}</td>
                    <td className="px-4 py-2">{user.role || 'N/A'}</td>
                    <td className="px-4 py-2">{user.town || 'N/A'}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))
             )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rental Listings */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">All Rental Listings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rentals.length === 0 ? (
            <p className="col-span-full text-gray-500">No rental listings found.</p>
          ) : (
            rentals.map(r => (
              <div key={r.id} className="border rounded-lg shadow overflow-hidden bg-gray-800">
                <img src={r.images?.[0]} alt={r.title} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{r.title}</h3>
                  <p className="text-sm text-gray-400 mt-1 truncate">{r.description}</p>
                  <p className="mt-2 text-green-400 font-medium">KES {r.price}/month</p>
                  <div className="mt-2 flex justify-between">
                    <span className={`inline-block text-xs px-2 py-1 rounded ${
                      r.status === 'available' ? 'bg-blue-900 text-blue-200' : 'bg-gray-700'
                    }`}>
                      {r.status}
                    </span>
                    <button
                      onClick={() => handleDeleteRental(r.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Messages Inbox */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Recent Messages</h2>
        <div className="bg-gray-800 p-4 rounded shadow">
          {messages.length === 0 ? (
            <p className="text-gray-500">No recent messages.</p>
          ) : (
            <ul className="space-y-3">
              {messages.map((msg, index) => (
                <li key={index} className="border-b border-gray-700 pb-2">
                  <p className="text-sm">
                    <strong>From:</strong> {msg.sender_name} → <strong>To:</strong> {msg.receiver_name}
                  </p>
                  <p className="truncate">{msg.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Chat Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Message Inbox</h2>
        <ChatInbox />
      </section>

      <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Available Rentals & Lodgings</h3>
              {/* Property Type Filter */}
              <div className="flex justify-center mb-6">
                <select
                  value={propertyType}
                  onChange={e => setPropertyType(e.target.value)}
                  className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700"
                >
                  <option value="all">All Types</option>
                  <option value="rental">Rental (Monthly)</option>
                  <option value="lodging">Lodging / AirBnB (Nightly)</option>
                </select>
              </div>
      
              {/* Map showing both Rentals and Lodgings/AirBnB */}
              {rentalsWithLocation.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold mb-2 text-center">All Rental & Lodging Locations</h4>
                  <MapComponent
                    rentals={rentalsWithLocation}
                    height="h-64 md:h-96"
                  />
                </div>
              )}
      
              {loading ? (
                <p className="text-gray-400">Loading...</p>
              ) : availableRentals.length === 0 ? (
                <p className="text-gray-500">No available rentals or lodgings found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleRentals.map(rental => (
                    <RentalCard key={rental.id} rental={rental} />
                  ))}
                </div>
              )}
            </section>

           <section className="mb-12">
  <h2 className="text-xl font-semibold mb-4 text-center">All Rental & Lodging Locations</h2>
  {rentalsWithLocation.length === 0 ? (
    <p className="text-gray-500 text-center">No rentals or lodgings with location data.</p>
  ) : (
    <div className="w-full h-96 mb-8 rounded overflow-hidden">
      <MapContainer
        center={[-1.286389, 36.817223]} // Nairobi default, adjust as needed
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {rentalsWithLocation.map(r => (
          <Marker
            key={r.id}
            position={[
              Number(r.location.coordinates[1]), // latitude
              Number(r.location.coordinates[0])  // longitude
            ]}
            icon={r.status === 'available' ? availableIcon : bookedIcon}
          >
            <Popup>
              <strong>{r.title}</strong>
              <br />
              {r.town && <span>{r.town}<br /></span>}
              {r.description?.slice(0, 60)}...
              <br />
              <span>
                <b>Type:</b> {r.mode === 'lodging' ? 'Lodging/AirBnB' : 'Rental'}
                <br />
                <b>Status:</b>{' '}
                <span style={{ color: r.status === 'available' ? '#38bdf8' : '#f87171' }}>
                  {r.status === 'available' ? 'Available' : 'Booked'}
                </span>
              </span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )}
</section>

      {/* Move View All Messages button just below the heading */}
      <div className="flex gap-4 mb-8">
        <button
          className={`px-4 py-2 rounded ${showAllMessages ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-200'}`}
          onClick={() => setShowAllMessages(v => !v)}
        >
          View All Messages
        </button>
      </div>
      {/* Show Chat modal/popup when Chat button is clicked */}
      {showAdminChat && selectedUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded shadow-lg w-full max-w-lg relative">
            <button
              onClick={() => setShowAdminChat(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl"
              aria-label="Close"
            >
              &times;
            </button>
            <Chat
              userId={adminUserId}
              isAdmin={true}
              otherUserId={selectedUserId} // Make sure this is set!
            />
          </div>
        </div>
      )}

      {/* All User Chats - Shown when "View All Messages" is clicked */}
      {showAllMessages && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">All User Chats</h2>
          <div className="flex gap-8">
            {/* User List */}
            <div className="w-1/3 bg-gray-800 rounded shadow p-4 max-h-[60vh] overflow-y-auto">
              <h4 className="font-medium mb-4">Users</h4>
              {allChats.length === 0 ? (
                <p className="text-gray-500 text-sm">No user chats found.</p>
              ) : (
                <ul className="space-y-2">
                  {allChats.map(u => (
                    <li
                      key={u.id}
                      className={`p-2 rounded cursor-pointer ${selectedChatUser?.id === u.id ? 'bg-blue-700 text-white' : 'hover:bg-gray-700'}`}
                      onClick={async () => {
                        setSelectedChatUser(u);
                        // Fetch messages with this user
                        const res = await axios.get(
                          `http://localhost:5000/api/chat/messages/admin/${adminUserId}/${u.id}`,
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        setChatMessages(res.data);
                      }}
                    >
                      <div className="font-semibold">{u.full_name || u.email}</div>
                      <div className="text-xs text-gray-400 truncate">
                        {u.lastMessage?.message}
                      </div>
                      <div className="text-xs text-gray-400">
                        {u.lastMessage && new Date(u.lastMessage.created_at).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Chat Window */}
            <div className="flex-1 bg-gray-800 rounded shadow p-4 flex flex-col max-h-[60vh]">
              <h4 className="font-medium mb-4">
                {selectedChatUser ? `Chat with ${selectedChatUser.full_name || selectedChatUser.email}` : 'Select a user'}
              </h4>
              <div className="flex-1 overflow-y-auto mb-4 space-y-2 border-b pb-2">
                {chatMessages.length === 0 ? (
                  <p className="text-gray-500 text-sm">No messages yet.</p>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className={`mb-2 ${msg.sender_id === adminUserId ? 'text-right' : ''}`}>
                      <span className={`inline-block px-3 py-1 rounded-lg ${msg.sender_id === adminUserId ? 'bg-blue-600' : 'bg-gray-700'} text-white max-w-xs`}>
                        {msg.message}
                      </span>
                      <div className="text-xs text-gray-400">
                        {new Date(msg.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                 )}
              </div>
              {/* Reply box */}
              {selectedChatUser && (
                <div className="flex space-x-2">
                  <input
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-grow p-2 bg-gray-700 text-white rounded"
                  />
                  <button
                    onClick={async () => {
                      if (!replyText.trim()) return;
                      await axios.post(
                        'http://localhost:5000/api/chat/send',
                        {
                          sender_id: adminUserId,
                          receiver_id: selectedChatUser.id,
                          message: replyText,
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      setReplyText('');
                      // Refresh chat
                      const res = await axios.get(
                        `http://localhost:5000/api/chat/messages/admin/${adminUserId}/${selectedChatUser.id}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      setChatMessages(res.data);
                    }}
                    className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}