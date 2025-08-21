import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Chat({ rentalId, landlordId, userName, userPhone, adminUserId, otherUserId }) {
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
  const isLandlord = userId === landlordId;

  // Try to fetch messages only if user is landlord or has sent a message
  useEffect(() => {
    if (!rentalId || !userId) return;

    if (isLandlord || hasSentFirst) {
      setLoading(true);
      api
        .get(`/chat/messages/${rentalId}`)
        .then((res) => setMessages(res.data))
        .catch(() => setMessages([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [rentalId, userId, isLandlord, hasSentFirst]);

  // Send message handler
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!userId) {
      alert('Missing user information. Please try again later.');
      console.error('Missing fields:', { userId, landlordId, rentalId, newMessage });
      return;
    }
    // If contacting admin, include name and phone in the message
    let messageToSend = newMessage;
    let receiverId = landlordId;
    let rentalIdToSend = rentalId;
    // If admin is sending to a specific user, use otherUserId
    if (otherUserId) {
      receiverId = otherUserId;
      rentalIdToSend = rentalId || null;
    } else if (!rentalId && userName && userPhone) {
      // If chatting with admin (no rentalId/landlordId), set receiverId to adminUserId prop and rentalId to null
      messageToSend = `From: ${userName} (${userPhone})\n${newMessage}`;
      receiverId = adminUserId || landlordId || 1; // fallback to 1 if not set
      rentalIdToSend = null;
    }
    if (!receiverId) {
      return <div className="text-red-500">Unable to start chat: missing landlord information.</div>;
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