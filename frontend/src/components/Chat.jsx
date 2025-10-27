import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Chat({ userId: userIdProp, rentalId, receiverId }) {
  const { user } = useAuth();
  // prefer UUID from auth context, fall back to prop (keeps backward compatibility)
  const userId = user?.id || userIdProp;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // UUID v4 validator
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  // Fetch messages for this rental and landlord
  useEffect(() => {
    if (!rentalId || !userId || !receiverId) return;

    // ensure IDs are correct types
    if (!uuidV4Regex.test(userId)) {
      console.error('Invalid authenticated user id (expected UUID):', userId);
      return;
    }
    if (!uuidV4Regex.test(receiverId)) {
      console.error('Invalid receiver id (expected UUID). Do not send numeric ids like "6". Got:', receiverId);
      return;
    }

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
      } catch (err) {
        console.error('Failed fetching messages:', err);
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

    if (!uuidV4Regex.test(userId) || !uuidV4Regex.test(receiverId)) {
      alert('Invalid user id format. Chat requires UUIDs.');
      console.error('Invalid UUIDs:', { userId, receiverId });
      return;
    }

    try {
      // Note: do not send sender_id — backend uses authenticated user (req.user.id)
      console.log('Sending message (payload):', {
        receiver_id: receiverId,
        message: newMessage,
        rental_id: rentalId,
      });
      await api.post('/chat/send', {
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

  const openConversation = async () => {
    if (!receiverId) return;
    if (!uuidV4Regex.test(receiverId)) {
      console.error('openConversation: invalid receiverId (expected UUID):', receiverId);
      return;
    }
    try {
      const res = await api.get(`/chat/messages/${receiverId}`);
      setMessages(res.data);
    } catch (err) {
      console.error('openConversation error:', err);
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
      <button onClick={openConversation} className="mt-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded">
        Open Conversation
      </button>
    </div>
  );
}