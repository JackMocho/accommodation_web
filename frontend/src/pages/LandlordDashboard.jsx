// filepath: d:\PROJECTS\Rentals fullstack\frontend\src\pages\LandlordDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import useSocket from '../hooks/useSocket'; // REMOVE THIS LINE
import NotificationBell from '../components/NotificationBell';
import api from '../utils/api';
import axios from 'axios';
import MapComponent from '../components/MapComponent';
import Chat from '../components/Chat';
import { useAuth } from '../context/AuthContext';

// Integrated RentalCard with map and status toggle
function RentalCard({ rental, onDelete, onEdit, onBook, onMakeAvailable }) {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-800 rounded shadow p-4 flex flex-col relative">
      <div onClick={() => navigate(`/rentals/${rental.id}`)} className="cursor-pointer">
        {rental.images && rental.images.length > 0 && (
          <img
            src={Array.isArray(rental.images) ? rental.images[0] : JSON.parse(rental.images)[0]}
            alt={rental.title}
            className="w-full h-40 object-cover rounded mb-2"
          />
        )}
        <h4 className="font-bold text-lg mb-1">{rental.title}</h4>
        <p className="text-gray-400 text-sm mb-2">{rental.description?.slice(0, 60)}...</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {rental.mode === 'lodging' ? (
            <span className="bg-green-700 text-white px-2 py-1 rounded text-xs">
              KES {rental.nightly_price}/night
            </span>
          ) : (
            <span className="bg-green-700 text-white px-2 py-1 rounded text-xs">
              KES {rental.price}/month
            </span>
          )}
          <span className="bg-blue-700 text-white px-2 py-1 rounded text-xs">{rental.type}</span>
          <span className="bg-yellow-700 text-white px-2 py-1 rounded text-xs">
            {rental.status && rental.status.trim().toLowerCase() === 'booked' ? 'Booked' : 'Available'}
          </span>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onEdit(rental.id)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(rental.id)}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
        >
          Delete
        </button>
        {rental.status !== 'booked' ? (
          <button
            onClick={() => onBook(rental.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Mark as Booked
          </button>
        ) : (
          <button
            onClick={() => onMakeAvailable(rental.id)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
          >
            Mark as Available
          </button>
        )}
      </div>
      {rental.location && Array.isArray(rental.location.coordinates) && (
        <div className="mt-2">
          <MapComponent
            rentals={[
              {
                ...rental,
                location: {
                  ...rental.location,
                  coordinates: [
                    rental.location.coordinates[0], // lat
                    rental.location.coordinates[1], // lng
                  ],
                },
              },
            ]}
            height="h-40"
          />
        </div>
      )}
    </div>
  );
}

export default function LandlordDashboard() {
  const [rentals, setRentals] = useState([]);
  const [loadingRentals, setLoadingRentals] = useState(false); // Add loading state
  const [editingRentalId, setEditingRentalId] = useState(null);
  const [showMessages, setShowMessages] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showAdminChat, setShowAdminChat] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [allChats, setAllChats] = useState([]);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedRental, setSelectedRental] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [inboxMessages, setInboxMessages] = useState([]); // New state for inbox messages

  // Default notifications to [] in case hook returns undefined
  // REMOVE this line:
  // const { notifications = [], clearNotifications } = useSocket();

  const { user, token } = useAuth();
  const userId = user?.id || localStorage.getItem('userId');
  const userName = user?.full_name || user?.name || localStorage.getItem('userName') || '';
  const userPhone = user?.phone || localStorage.getItem('userPhone') || '';
  const welcomeMsg = `Welcome, ${userName} (Landlord)`;
  const adminUserId = '1';
  const navigate = useNavigate();

  // Debugging: Log the JWT token on every render
  console.log('JWT token in localStorage:', localStorage.getItem('token'));

  // Fetch rentals for this landlord (user)
  const fetchRentals = async () => {
    setLoadingRentals(true);
    try {
      console.log('Fetching rentals for user:', user?.id); // Debug log
      if (!user?.id) {
        setRentals([]);
        setLoadingRentals(false);
        return;
      }
      const res = await api.get(`/rentals/user?id=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Rentals response:', res.data); // Debug log
      const userRentals = Array.isArray(res.data)
        ? res.data.filter(r => String(r.user_id) === String(user.id))
        : [];
      setRentals(userRentals);
    } catch (err) {
      setRentals([]);
    }
    setLoadingRentals(false);
  };

  // Fetch recent messages for landlord
  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/messages/recent/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data || [];
      setMessages(data.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      setMessages([]);
    }
  };

  // Fetch all chats for landlord
  const fetchAllChats = async () => {
    try {
      const res = await api.get(`/chat/messages/recent/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data || [];
      const chatUsers = [];
      for (const msg of data) {
        if (msg.receiver_id === Number(userId) || msg.sender_id === Number(userId)) {
          const otherUserId = msg.sender_id === Number(userId) ? msg.receiver_id : msg.sender_id;
          if (!chatUsers.some(u => u.userId === otherUserId && u.rentalId === msg.rental_id)) {
            chatUsers.push({
              userId: otherUserId,
              rentalId: msg.rental_id,
              userName: msg.sender_id === Number(userId) ? msg.receiver_name : msg.sender_name,
              lastMessage: msg
            });
          }
        }
      }
      setAllChats(chatUsers);
    } catch (err) {
      setAllChats([]);
    }
  };

  useEffect(() => {
    if (!token) {
      alert('Session expired. Please log in again.');
      window.location.href = '/login';
      return;
    }
    fetchRentals();
    fetchMessages();
    fetchAllChats();
    // eslint-disable-next-line
  }, [token, user?.id]);

  // Fetch inbox messages periodically
  useEffect(() => {
    let intervalId;
    if (user?.id) {
      const fetchMessages = () => {
        api.get(`/chat/messages/recent/${user.id}`)
          .then(res => setInboxMessages(res.data))
          .catch(() => setInboxMessages([]));
      };
      fetchMessages();
      intervalId = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    }
    return () => clearInterval(intervalId);
  }, [user]);

  // Delete rental handler
  const handleDeleteRental = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rental?')) return;
    try {
      await api.delete(`/rentals/${id}`);
      await fetchRentals();
      alert('Rental deleted successfully');
    } catch (err) {
      alert('Failed to delete rental');
    }
  };

  // Reply handler
  const handleReply = async (msg) => {
    if (!replyText.trim()) return;
    try {
      await api.post(
        '/chat/send',
        {
          rental_id: msg.rental_id,
          sender_id: userId,
          receiver_id: msg.sender_id,
          message: replyText,
        }
      );
      setReplyingTo(null);
      setReplyText('');
      fetchMessages();
    } catch (err) {
      alert('Failed to send reply');
    }
  };

  // Book rental handler: sets status to 'booked'
  const handleBookRental = async (id) => {
    if (!window.confirm('Mark this rental as Booked?')) return;
    try {
      await api.put(`/rentals/${id}/book`, { status: 'booked' });
      await fetchRentals(); // Refresh rentals after booking
      setSuccessMsg('Rental marked as Booked!'); // Show success message
      setTimeout(() => setSuccessMsg(''), 2000); // Optionally clear after 2s
    } catch (err) {
      alert('Failed to mark as Booked');
    }
  };

  // Make available handler: sets status to 'available'
  const handleMakeAvailable = async (id) => {
    if (!window.confirm('Mark this rental as available?')) return;
    try {
      await api.put(`/rentals/${id}/book`, { status: 'available' });
      await fetchRentals();
      alert('Rental marked as available!');
    } catch (err) {
      alert('Failed to mark as available');
    }
  };

  // Only show available and booked rentals
  const visibleRentals = rentals.filter(r => r.status === 'available' || r.status === 'booked');

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-blue-900 to-purple-900">
      <div className="mb-2">
        <h2 className="text-2xl font-bold">{welcomeMsg}</h2>
      </div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 items-center">
          <button
            className={`px-4 py-2 rounded ${showMessages ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-200'} ml-0`}
            onClick={() => setShowMessages((v) => !v)}
          >
            Messages
            {/* Remove or replace notifications badge */}
          </button>
          <button
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded shadow text-lg ml-4"
            onClick={() => setShowAdminChat(true)}
          >
            Contact Admin
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <NotificationBell notifications={[]} clearNotifications={() => {}} />
        </div>

        {showAdminChat && (
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
                landlordId={adminUserId}
                userName={userName}
                userPhone={userPhone}
              />
            </div>
          </div>
        )}
      </div>

      {/* List Your Property Button */}
      <div className="flex justify-end mb-6">
        <Link
          to="/submit-rental"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold shadow"
        >
          + List Your Property
        </Link>
      </div>

      {/* Success message */}
      {(editSuccess || successMsg) && (
        <div className="mb-4 p-3 bg-green-700 text-white rounded shadow text-center font-semibold">
          {successMsg ? successMsg : 'Successfully edited'}
        </div>
      )}

      {/* Messages Tab */}
      {showMessages && (
        <section className="mb-8 fixed inset-0 z-[1000] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-80 z-[1000] pointer-events-auto"
            onClick={() => setShowMessages(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-2xl max-w-lg w-full mx-2 z-[1010] flex flex-col border border-blue-700">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl"
              onClick={() => setShowMessages(false)}
            >
              &times;
            </button>
            <h3 className="text-xl font-semibold mb-4 mt-4 text-center">Recent Messages</h3>
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              {(messages?.length || 0) === 0 ? (
                <p className="text-gray-400">No recent messages.</p>
              ) : (
                <ul className="space-y-3">
                  {messages
                    .slice()
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map((msg, idx) => (
                      <li key={idx} className="border-b border-red-700 pb-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-blue-300">
                            {msg.sender_name || msg.sender_id}
                            {msg.sender_email && (
                              <span className="ml-2 text-yellow-300 text-xs">
                                ({msg.sender_email})
                              </span>
                            )}
                            {" "}→ {msg.receiver_name || msg.receiver_id}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(msg.created_at).toLocaleString()
                            }
                          </span>
                        </div>
                        <div className="text-sm text-gray-200 mt-1">{msg.message}</div>
                        <div className="text-xs text-gray-400">
                          Rental: <span className="font-semibold">{msg.rental_title || msg.title || msg.rental_id}</span>
                        </div>
                        <button
                          className="mt-2 text-blue-400 hover:underline text-sm"
                          onClick={() => {
                            setReplyingTo(msg.id);
                            setReplyText('');
                          }}
                        >
                          Reply
                        </button>
                        {replyingTo === msg.id && (
                          <div className="mt-2 flex gap-2">
                            <input
                              type="text"
                              className="flex-1 rounded px-2 py-1 text-white"
                              placeholder="Type your reply..."
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                            />
                            <button
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                              onClick={() => handleReply(msg)}
                            >
                              Send
                            </button>
                            <button
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
                              onClick={() => setReplyingTo(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Rentals Section */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Your Rentals</h3>
        {loadingRentals ? (
          <div className="text-center text-yellow-300 font-bold text-lg py-8">Loading...</div>
        ) : visibleRentals.length === 0 ? (
          <p className="text-gray-500">No rentals found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleRentals.map((r) => (
              <div key={r.id} className="mb-6">
                <RentalCard
                  rental={r}
                  onDelete={handleDeleteRental}
                  onEdit={setEditingRentalId}
                  onBook={handleBookRental}
                  onMakeAvailable={handleMakeAvailable}
                />
                {editingRentalId === r.id && (
                  <EditRentalForm
                    rental={r}
                    onSave={() => setEditingRentalId(null)}
                    onCancel={() => setEditingRentalId(null)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      {/* Rental detail modal with map */}
      {selectedRental && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl"
              onClick={() => setSelectedRental(null)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-2">{selectedRental.title}</h2>
            <p className="mb-2">{selectedRental.description}</p>
            <div className="mb-4">
              <strong>Status:</strong> {selectedRental.status}
            </div>
            <div className="mb-4">
              <MapComponent
                rentals={[selectedRental]}
                height="h-64"
              />
            </div>
          </div>
        </div>
      )}
      {/* View All Messages Section */}
      <div className="flex gap-4 mb-8">
        <button
          className={`px-4 py-2 rounded ${showAllMessages ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-200'}`}
          onClick={() => setShowAllMessages(v => !v)}
        >
          View All Messages
        </button>
      </div>
      {showAllMessages && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">All User Chats</h2>
          <div className="flex gap-8">
            <div className="w-1/3 bg-gray-800 rounded shadow p-4 max-h-[60vh] overflow-y-auto">
              <h4 className="font-medium mb-4">Clients</h4>
              {allChats.length === 0 ? (
                <p className="text-gray-500 text-sm">No user chats found.</p>
              ) : (
                <ul className="space-y-2">
                  {allChats.map(u => (
                    <li
                      key={u.userId + '-' + u.rentalId}
                      className={`p-2 rounded cursor-pointer ${selectedChatUser?.userId === u.userId && selectedChatUser?.rentalId === u.rentalId ? 'bg-blue-700 text-white' : 'hover:bg-gray-700'}`}
                      onClick={async () => {
                        setSelectedChatUser(u);
                        // Fetch messages for this rental and client
                        const res = await api.get(
                          `/chat/messages/${u.rentalId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                          }
                        );
                        setChatMessages(res.data.filter(
                          m => (m.sender_id === u.userId || m.receiver_id === u.userId)
                        ));
                      }}
                    >
                      <div className="font-semibold">{u.userName || u.userId}</div>
                      <div className="text-xs text-gray-400 truncate">
                        {u.lastMessage?.message}
                      </div>
                      <div className="text-xs text-gray-400">
                        {u.lastMessage && new Date(u.lastMessage.created_at).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        Rental: <span className="font-semibold">{u.lastMessage?.rental_title || u.lastMessage?.title || u.rentalId}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex-1 bg-gray-800 rounded shadow p-4 flex flex-col max-h-[60vh]">
              <h4 className="font-medium mb-4">
                {selectedChatUser ? `Chat with ${selectedChatUser.userName || selectedChatUser.userId}` : 'Select a client'}
              </h4>
              <div className="flex-1 overflow-y-auto mb-4 space-y-2 border-b pb-2">
                {chatMessages.length === 0 ? (
                  <p className="text-gray-500 text-sm">No messages yet.</p>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className={`mb-2 ${msg.sender_id === Number(userId) ? 'text-right' : ''}`}>
                      <span className={`inline-block px-3 py-1 rounded-lg ${msg.sender_id === Number(userId) ? 'bg-blue-600' : 'bg-gray-700'} text-white max-w-xs`}>
                        {msg.message}
                      </span>
                      <div className="text-xs text-gray-400">
                        {new Date(msg.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
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
                      await api.post(
                        '/chat/send',
                        {
                          sender_id: userId,
                          receiver_id: selectedChatUser.userId,
                          message: replyText,
                          rental_id: selectedChatUser.rentalId,
                        }
                      );
                      setReplyText('');
                      // Refresh chat
                      const res = await api.get(
                        `/chat/messages/${selectedChatUser.rentalId}`, {
                          headers: { Authorization: `Bearer ${token}` }
                        }
                      );
                      setChatMessages(res.data.filter(
                        m => (m.sender_id === selectedChatUser.userId || m.receiver_id === selectedChatUser.userId)
                      ));
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
  );
}