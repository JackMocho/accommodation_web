import React from 'react';

/*
  Defensive NotificationBell:
  - Accepts undefined props safely
  - Treats notifications as an array (defaults to [])
  - clearNotifications defaults to a no-op
*/
export default function NotificationBell(props) {
  const { notifications = [], clearNotifications = () => {} } = props || {};
  const count = Array.isArray(notifications) ? notifications.length : 0;

  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        className="relative p-2 rounded-full hover:bg-gray-700 focus:outline-none"
        onClick={() => {
          // toggle or clear via provided callback if present
          try {
            clearNotifications();
          } catch (e) {
            // noop
            console.debug('clearNotifications failed', e);
          }
        }}
      >
        {/* Simple bell icon (text fallback if icons not available) */}
        <span className="text-white">🔔</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5">
            {count}
          </span>
        )}
      </button>
    </div>
  );
}