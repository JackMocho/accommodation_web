import React from 'react';
import useSocket from '../hooks/useSocket';

export default function NotificationBell() {
  const { notifications, clearNotifications } = useSocket();

  return (
    <div className="relative">
      <button className="text-white hover:text-blue-300">
        🔔
      </button>
      {notifications.length > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs animate-bounce">
          {notifications.length}
        </span>
      )}

      {/* Dropdown */}
      {notifications.length > 0 && (
        <div className="absolute top-8 right-0 bg-gray-800 p-2 rounded shadow w-64 z-10 max-h-60 overflow-y-auto">
          <h3 className="font-semibold mb-2">New Messages</h3>
          <ul>
            {notifications.map((n, i) => (
              <li key={i} className="border-b border-gray-700 py-2 text-sm">
                New message on listing ID: {n.rental_id}
              </li>
            ))}
          </ul>
          <button onClick={clearNotifications} className="mt-2 text-xs text-blue-400 underline">
            Clear
          </button>
        </div>
      )}
    </div>
  );
}