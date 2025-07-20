import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { Notification } from '../types';
import { Bell } from 'lucide-react';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }
        setNotifications(data || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 flex items-center">
        <Bell className="mr-2" />
        Notifications
      </h1>
      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p>You have no new notifications.</p>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow ${
                notification.is_read ? 'bg-gray-100' : 'bg-white'
              }`}
            >
              <p className="text-gray-800">{notification.message}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
                {!notification.is_read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="text-sm text-blue-500 hover:underline"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
