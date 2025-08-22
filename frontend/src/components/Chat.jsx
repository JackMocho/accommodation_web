import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function Chat({ userId, rentalId, receiverId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch messages for this rental and landlord
  useEffect(() => {
    if (!rentalId || !userId || !receiverId) return;
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/chat/messages/${rentalId}`);
        setMessages(
          res.data.filter(
            msg =>
              (msg.sender_id === userId && msg.receiver_id === receiverId) ||
              (msg.sender_id === receiverId && msg.receiver_id === userId)
          )
        );
      } catch {
        setMessages([]);
      }
      setLoading(false);
    };
    fetchMessages();
  }, [rentalId, userId, receiverId]);

  // Send message handler
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!userId || !receiverId || !rentalId) {
      alert('Missing chat information. Please try again later.');
      console.error('Missing fields:', { userId, receiverId, rentalId, newMessage });
      return;
    }
    try {
      // Debug log
      console.log('Sending:', {
        sender_id: userId,
        receiver_id: receiverId,
        message: newMessage,
        rental_id: rentalId,
      });
      await api.post('/chat/send', {
        sender_id: userId,
        receiver_id: receiverId,
        message: newMessage,
        rental_id: rentalId,
      });
      setNewMessage('');
      // Refresh messages
      const res = await api.get(`/chat/messages/${rentalId}`);
      setMessages(
        res.data.filter(
          msg =>
            (msg.sender_id === userId && msg.receiver_id === receiverId) ||
            (msg.sender_id === receiverId && msg.receiver_id === userId)
        )
      );
    } catch (err) {
      alert('Failed to send message');
      console.error('Send message error:', err?.response?.data || err);
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
          onChange={e => setNewMessage(e.target.value)}
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