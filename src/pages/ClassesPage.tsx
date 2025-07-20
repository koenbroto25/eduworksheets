import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { supabaseService } from '../services/supabaseService';
import { Class } from '../types';

const ClassesPage: React.FC = () => {
  const { user, supabase } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user || user.role === 'parent' || !supabase) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const { data, error } = await supabaseService.getUserClasses(supabase, user.id, user.role);
        if (error) {
          throw error;
        }
        setClasses(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch classes');
        console.error('Error fetching classes:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, [user]);

  const handleShareClassLink = (e: React.MouseEvent, classId: string) => {
    e.stopPropagation();
    const shareLink = `${window.location.origin}/join-class/${classId}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      alert('Tautan kelas disalin ke papan klip!');
    }, (err) => {
      alert('Gagal menyalin tautan kelas.');
      console.error('Could not copy text: ', err);
    });
  };

  if (isLoading) {
    return <div className="text-center p-8">Memuat...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Kesalahan: {error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Kelas Saya</h1>
        {user?.role === 'teacher' && (
          <Button onClick={() => navigate('/create-class')}>Buat Kelas Baru</Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {classes.map((cls) => (
          <div 
            key={cls.id} 
            className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={() => navigate(`/class/${cls.id}`)}
          >
            <h2 className="text-xl font-semibold">{cls.name}</h2>
            <p className="text-gray-600 mt-2">{cls.description}</p>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0115 8a5 5 0 015 5v2a1 1 0 01-1 1h-2.07zM5 8a5 5 0 014.472 7.005A6.97 6.97 0 008 16c0 .34.024.673.07 1H4a1 1 0 01-1-1v-2a5 5 0 015-5z" />
              </svg>
              <span>{cls.student_count} Siswa</span>
            </div>
            {user?.role === 'teacher' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button 
                  onClick={(e) => handleShareClassLink(e, cls.id)} 
                >
                  Bagikan Tautan Kelas
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassesPage;
