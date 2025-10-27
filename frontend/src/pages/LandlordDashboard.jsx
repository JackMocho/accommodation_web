// filepath: d:\PROJECTS\Rentals fullstack\frontend\src\pages\LandlordDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import api from '../utils/api';
import MapComponent from '../components/MapComponent';
import { useAuth } from '../context/AuthContext';

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
                    rental.location.coordinates[0],
                    rental.location.coordinates[1],
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
  const [loadingRentals, setLoadingRentals] = useState(false);
  const [editingRentalId, setEditingRentalId] = useState(null);
  const [showMessages, setShowMessages] = useState(false);
  const [inboxMessages, setInboxMessages] = useState([]);
  const [replyThread, setReplyThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const { user, token } = useAuth();
  const userId = user?.id;
  const userName = user?.full_name || user?.name || '';
  const navigate = useNavigate();

  // Fetch rentals
  const fetchRentals = async () => {
    setLoadingRentals(true);
    try {
      const res = await api.get('/rentals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let data = res.data;
      if (Array.isArray(data)) {
        const uid = String(userId);
        data = data
          .filter(r =>
            [r.user_id, r.owner_id, r.landlord_id].map(v => (v === undefined || v === null) ? '' : String(v)).includes(uid)
          )
          .map(r => ({
            ...r,
            images: Array.isArray(r.images)
              ? r.images
              : (typeof r.images === 'string' && r.images.startsWith('['))
                ? JSON.parse(r.images)
                : [],
          }));
      } else {
        data = [];
      }
      setRentals(data);
    } catch (err) {
      setRentals([]);
    }
    setLoadingRentals(false);
  };

  // Fetch inbox messages
  useEffect(() => {
    let intervalId;
    if (userId) {
      const fetchMessages = () => {
        api.get(`/chat/messages/recent/${userId}`)
          .then(res => setInboxMessages(res.data))
          .catch(() => setInboxMessages([]));
      };
      fetchMessages();
      intervalId = setInterval(fetchMessages, 5000);
    }
    return () => clearInterval(intervalId);
  }, [userId]);

  // Fetch thread messages when replyThread changes
  useEffect(() => {
    if (replyThread && replyThread.rentalId) {
      api.get(`/chat/messages/${replyThread.rentalId}`)
        .then(res => setThreadMessages(res.data))
        .catch(() => setThreadMessages([]));
    }
  }, [replyThread]);

  // Send message in thread
  const handleSendMessage = async () => {
    if (!replyText.trim() || !replyThread) return;
    await api.post('/chat/send', {
      rental_id: replyThread.rentalId,
      sender_id: userId,
      receiver_id: replyThread.receiverId,
      message: replyText,
    });
    setReplyText('');
    api.get(`/chat/messages/${replyThread.rentalId}`)
      .then(res => setThreadMessages(res.data))
      .catch(() => setThreadMessages([]));
  };

  useEffect(() => {
    if (!token) {
      alert('Session expired. Please log in again.');
      window.location.href = '/login';
      return;
    }
    fetchRentals();
  }, [token, userId]);

  // Book rental handler
  const handleBookRental = async (id) => {
    if (!window.confirm('Mark this rental as Booked?')) return;
    try {
      await api.put(`/rentals/${id}/book`, { status: 'booked' });
      await fetchRentals();
    } catch (err) {
      alert('Failed to mark as Booked');
    }
  };

  // Make available handler
  const handleMakeAvailable = async (id) => {
    if (!window.confirm('Mark this rental as available?')) return;
    try {
      await api.put(`/rentals/${id}/book`, { status: 'available' });
      await fetchRentals();
    } catch (err) {
      alert('Failed to mark as available');
    }
  };

  // Delete rental handler
  const handleDeleteRental = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rental?')) return;
    try {
      await api.delete(`/rentals/${id}`);
      await fetchRentals();
    } catch (err) {
      alert('Failed to delete rental');
    }
  };

  const visibleRentals = rentals.filter(
    r => r.status === 'available' || r.status === 'booked'
  );

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-blue-900 to-purple-900">
      <div className="mb-2">
        <h2 className="text-2xl font-bold">Welcome, {userName} (Landlord)</h2>
      </div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 items-center">
          <button
            className={`px-4 py-2 rounded ${showMessages ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-200'} ml-0`}
            onClick={() => setShowMessages((v) => !v)}
          >
            Messages
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <NotificationBell notifications={[]} clearNotifications={() => {}} />
        </div>
      </div>
      <div className="flex justify-end mb-6">
        <Link
          to="/submit-rental"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold shadow"
        >
          + List Your Property
        </Link>
      </div>
      {/* Messages Modal */}
      {showMessages && (
        <section className="mb-8 fixed inset-0 z-[1000] flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-80 z-[1000] pointer-events-auto"
            onClick={() => setShowMessages(false)}
          />
          <div className="relative bg-white rounded-lg shadow-2xl max-w-lg w-full mx-2 z-[1010] flex flex-col border border-blue-700">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl"
              onClick={() => setShowMessages(false)}
            >
              &times;
            </button>
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-2 text-center font-semibold rounded-tl-3xl ${!replyThread ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setReplyThread(null)}
              >
                Inbox
              </button>
              <button
                className={`flex-1 py-2 text-center font-semibold rounded-tr-3xl ${replyThread ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'}`}
                disabled={!replyThread}
              >
                Reply
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              {!replyThread ? (
                <>
                  <h3 className="font-semibold mb-4 text-lg">Your Messages</h3>
                  {inboxMessages.length === 0 ? (
                    <p className="text-gray-500">No messages found.</p>
                  ) : (
                    <ul className="space-y-3">
                      {inboxMessages.map((msg, idx) => (
                        <li
                          key={idx}
                          className="border-b border-gray-200 pb-2 cursor-pointer hover:bg-blue-50 rounded transition"
                          onClick={() => {
                            setReplyThread({
                              rentalId: msg.rental_id,
                              receiverId: msg.sender_id === userId ? msg.receiver_id : msg.sender_id,
                              rentalTitle: msg.rental_title || msg.title || msg.rental_id,
                            });
                          }}
                        >
                          <div className="text-sm">
                            <span className="font-bold">{msg.sender_id === userId ? 'You' : 'Client'}:</span>{' '}
                            {msg.message}
                          </div>
                          <div className="text-xs text-gray-500">
                            Rental: <span className="font-semibold">{msg.rental_title || msg.title || msg.rental_id}</span> | {new Date(msg.created_at).toLocaleString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <div>
                  <h3 className="font-semibold mb-2 text-lg">
                    Chat for Rental: <span className="text-blue-700">{replyThread.rentalTitle}</span>
                  </h3>
                  <div className="overflow-y-auto max-h-60 mb-2">
                    {threadMessages.length === 0 ? (
                      <p className="text-gray-500">No messages yet.</p>
                    ) : (
                      threadMessages.map((msg, idx) => (
                        <div key={idx} className={`mb-2 ${msg.sender_id === userId ? 'text-right' : ''}`}>
                          <span className={`inline-block px-3 py-1 rounded-lg ${msg.sender_id === userId ? 'bg-blue-600' : 'bg-gray-700'} text-white max-w-xs`}>
                            {msg.message}
                          </span>
                          <div className="text-xs text-gray-400">
                            {new Date(msg.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      className="flex-1 rounded px-2 py-1 border border-blue-400"
                      placeholder="Type your message..."
                    />
                    <button
                      className="bg-blue-700 text-white px-3 py-1 rounded"
                      onClick={handleSendMessage}
                    >
                      Send
                    </button>
                  </div>
                </div>
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
                {/* Add EditRentalForm if needed */}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}