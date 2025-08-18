// filepath: d:\Real property App\frontend\src\pages\LandlordDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import NotificationBell from '../components/NotificationBell';
import { useAuth } from '../context/AuthContext';
import EditRentalForm from './EditRentalForm';
import Chat from '../components/Chat';
import api from '../utils/api';
import RentalCard from '../components/RentalCard';

export default function LandlordDashboard() {
  const [rentals, setRentals] = useState([]);
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
  const { notifications, clearNotifications } = useSocket();
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const userId = user?.id || localStorage.getItem('userId');
  const userName = user?.full_name || user?.name || localStorage.getItem('userName') || '';
  const userPhone = user?.phone || localStorage.getItem('userPhone') || '';
  const welcomeMsg = `Welcome, ${userName} (Landlord)`;
  const adminUserId = '1';

  // Fetch rentals
  const fetchRentals = async () => {
    try {
      const res = await api.get(`/rentals/user?id=${userId}`);
      setRentals(res.data);
    } catch (err) {
      console.error('Failed to load rentals:', err);
    }
  };

  // Fetch recent messages for landlord
  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/messages/recent/${userId}`);
      setMessages(res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      setMessages([]);
    }
  };

  // Fetch all chats for landlord
  const fetchAllChats = async () => {
    try {
      const res = await api.get(`/chat/messages/recent/${userId}`);
      const chatUsers = [];
      for (const msg of res.data) {
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
  }, [token]);

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

  // Book/unbook rental handler (uses status)
  const handleBookRental = async (id) => {
    if (!window.confirm('Mark this rental as Booked?')) return;
    try {
      await fetch(`/api/rentals/${id}/book`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'booked' }),
        credentials: 'include'
      });
      await fetchRentals();
      alert('Rental marked as Booked!');
    } catch (err) {
      alert('Failed to mark as Booked');
    }
  };

  const handleMakeAvailable = async (id) => {
    if (!window.confirm('Mark this rental as available?')) return;
    try {
      await fetch(`/api/rentals/${id}/book`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'available' }),
        credentials: 'include'
      });
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
            {notifications.length > 0 && (
              <span className="ml-2 bg-red-500 text-white rounded-full px-2 text-xs">
                {notifications.length}
              </span>
            )}
          </button>
          <button
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded shadow text-lg ml-4"
            onClick={() => setShowAdminChat(true)}
          >
            Contact Admin
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <NotificationBell notifications={notifications} clearNotifications={clearNotifications} />
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
        <section className="mb-8 bg-blue-950 rounded shadow p-4">
          <h3 className="text-xl font-semibold mb-4">Recent Messages</h3>
          {messages.length === 0 ? (
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
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-200 mt-1">{msg.message}</div>
                    <div className="text-xs text-gray-400">
                      Rental ID: {msg.rental_id}
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
        </section>
      )}

      {/* Rentals Section */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Your Rentals</h3>
        {visibleRentals.length === 0 ? (
          <p className="text-gray-500">No rentals found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleRentals.map((r) => (
              <div key={r.id} className="mb-6">
                <RentalCard
                  rental={r}
                  onDelete={handleDeleteRental}
                  onEdit={setEditingRentalId}
                  // Pass book and available handlers as props
                  onBook={() => handleBookRental(r.id)}
                  onMakeAvailable={() => handleMakeAvailable(r.id)}
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
                          `/chat/messages/${u.rentalId}`
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
                        Rental ID: {u.rentalId}
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
                        `/chat/messages/${selectedChatUser.rentalId}`
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