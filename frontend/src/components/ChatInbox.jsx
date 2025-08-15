import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';

const adminUserId = 1; // Set your actual admin user ID here

export default function ChatInbox({ userId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const res = await api.get(`/chat/messages/recent/${userId}`);
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to load inbox:', err);
      }
    };

    if (!userId) return;

    fetchInbox();
  }, [userId]);

  return (
    <div className="bg-gray-800 p-4 rounded shadow">
      <h4 className="font-medium mb-4">Recent Messages</h4>
      {messages.length === 0 ? (
        <p className="text-gray-500 text-sm">No recent messages.</p>
      ) : (
        <ul className="space-y-3">
          {messages.map((msg, index) => (
            <li key={index} className="border-b border-gray-700 pb-2">
              <p className="text-sm">
                {msg.message}
                {((msg.sender_id === adminUserId) || (msg.receiver_id === adminUserId)) && (
                  <span className="ml-2 px-2 py-1 bg-yellow-600 text-xs rounded text-white">Admin</span>
                )}
              </p>
              <small className="text-xs text-gray-400">
                From: {msg.sender_name} ({msg.sender_email}) | Rental: {msg.rental_id}
              </small>
              {/* Reply button: only show if the current user is the landlord (receiver) */}
              {msg.receiver_id === Number(userId) && (
                <div className="mt-2">
                  <Link
                    to={`/rentals/${msg.rental_id}?replyTo=${msg.sender_id}`}
                    className="text-blue-400 underline text-xs"
                  >
                    Reply
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}