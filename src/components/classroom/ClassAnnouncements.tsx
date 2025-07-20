import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { supabaseService } from '../../services/supabaseService';

interface Announcement {
  id: string;
  message: string;
  created_at: string;
  author: {
    name: string;
    avatar_url: string;
  };
}

const ClassAnnouncements: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!classId) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabaseService.getClassAnnouncements(supabase, classId);
        if (error) throw error;
        setAnnouncements(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch announcements');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [classId]);

  if (isLoading) {
    return <div className="text-center p-4">Loading announcements...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Pengumuman</h2>
      {announcements.length > 0 ? (
        <ul className="space-y-4">
          {announcements.map(announcement => (
            <li key={announcement.id} className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-start">
                <img 
                  src={announcement.author.avatar_url || '/default-avatar.png'} 
                  alt={announcement.author.name} 
                  className="w-10 h-10 rounded-full mr-4" 
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{announcement.author.name}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-gray-700">{announcement.message}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>Belum ada pengumuman.</p>
      )}
    </div>
  );
};

export default ClassAnnouncements;
