import React, { useState, useEffect } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=5');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (_e) {
      // Not logged in or error
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (_err) {
      // Ignore
    }
  };

  const handleActionClick = (notif) => {
    setIsOpen(false);
    if (notif.action_url) {
      navigate(notif.action_url);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (_err) {
      // Ignore
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-full relative transition-colors"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in duration-150">
          <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-semibold text-sm text-slate-800">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No notifications right now
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleActionClick(n)}
                  className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                    !n.is_read ? 'bg-brand-50/40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-slate-900">{n.title}</p>
                    {!n.is_read && (
                      <button
                        onClick={(e) => handleMarkAsRead(n._id, e)}
                        title="Mark as read"
                        className="text-slate-400 hover:text-brand-600 ml-2"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                  {n.action_type !== 'none' && (
                    <div className="mt-2 flex items-center space-x-1 text-brand-600 font-medium hover:underline">
                      <span className="capitalize">{n.action_type.replace('_', ' ')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(n.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
