import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Bell, FilePlus, CheckCircle, AlertTriangle } from 'lucide-react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Notification, NotificationType } from '../../types';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'assignment_new':
      return <FilePlus className="h-5 w-5 text-blue-500" />;
    case 'assignment_completed_passed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'assignment_completed_failed':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'assignment_overdue':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'class_join':
    case 'announcement':
        return <FilePlus className="h-5 w-5 text-blue-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
        }
      }
    };

    fetchNotifications();

    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` }, 
      (payload: RealtimePostgresChangesPayload<Notification>) => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Potentially mark as read and navigate
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Link to="/notifications" className="relative" onClick={() => setIsOpen(false)}>
        <Bell className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </Link>
    </div>
  );
};

export default NotificationBell;
