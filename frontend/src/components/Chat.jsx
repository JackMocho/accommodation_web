import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Chat({ rentalId, receiverId, userName, userPhone, adminUserId, otherUserId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [hasSentFirst, setHasSentFirst] = useState(false);
  const [loading, setLoading] = useState(true);

  // Decode user from JWT token
  const token = localStorage.getItem('token');
  let decoded = null;
  try {
    decoded = token ? JSON.parse(atob(token.split('.')[1])) : null;
  } catch {
    decoded = null;
  }
  const userId = decoded?.id;
  const isLandlord = userId === adminUserId;

  // Fetch messages
  const fetchMessages = async () => {
    if (!rentalId || !userId) return;
    setLoading(true);
    try {
      const res = await api.get(`/chat/messages/${rentalId}`);
      setMessages(res.data);
    } catch {
      setMessages([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isLandlord || hasSentFirst) {
      fetchMessages();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [rentalId, userId, isLandlord, hasSentFirst]);

  // Send message handler
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!userId) {
      alert('Missing user information. Please try again later.');
      return;
    }
    if (!receiverId) {
      alert('Missing receiver information. Please try again later.');
      return;
    }
    try {
      const payload = {
        sender_id: userId,
        receiver_id: receiverId,
        message: newMessage,
        rental_id: rentalId,
      };
      await api.post('/chat/send', payload);
      setNewMessage('');
      setHasSentFirst(true);
      fetchMessages(); // <-- Refresh messages after sending
    } catch (err) {
      alert('Failed to send message');
      console.error(err);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded shadow">
      <h3 className="font-semibold mb-4">Chat with Landlord</h3>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="space-y-2 h-40 overflow-y-auto mb-4 border-b pb-2">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`mb-2 ${msg.sender_id === userId ? 'text-right' : ''}`}>
                <span className="inline-block px-3 py-1 rounded-lg bg-blue-600 text-white max-w-xs">
                  {msg.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
      <div className="flex space-x-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow p-2 bg-gray-700 text-white rounded"
        />
        <button onClick={sendMessage} className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded">
          Send
        </button>
      </div>
    </div>
  );
}