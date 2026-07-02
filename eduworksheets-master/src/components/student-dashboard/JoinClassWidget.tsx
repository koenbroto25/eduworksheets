import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseService } from '../../services/supabaseService';
import { Button } from '../common/Button';
import { useNavigate } from 'react-router-dom';
import { Class, FindByCodeResponse } from '../../types';

const JoinClassWidget = () => {
  const { user, supabase } = useAuth();
  const navigate = useNavigate();
  const [classCode, setClassCode] = useState('');
  const [classDetails, setClassDetails] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);

  const handleSearch = async () => {
    if (!classCode.trim() || !supabase) return;
    setIsLoading(true);
    setError(null);
    setClassDetails(null);
    setIsMember(false);

    try {
      const { data, error } = await supabaseService.findByCode(supabase, classCode.trim()) as { data: FindByCodeResponse | null, error: any };

      if (error) {
        throw new Error(error.message || 'Kelas tidak ditemukan atau kode salah.');
      }

      if (data && data.type === 'class') {
        setClassDetails(data.details);
        // Check if student is already a member
        if (user) {
          const { isMember, error: memberError } = await supabaseService.isStudentInClass(supabase, data.details.id, user.id);
          if (memberError) console.error("Error checking membership:", memberError);
          setIsMember(isMember);
        }
      } else {
        throw new Error('Kode yang dimasukkan bukan untuk kelas.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClass = async () => {
    if (!user || !supabase || !classDetails) return;
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabaseService.joinClassWithCode(supabase, classDetails.class_code, user.id);
      if (error) {
        throw error;
      }
      // Redirect to the class page after joining
      navigate(`/class/${classDetails.id}`);
    } catch (err: any) {
      setError(err.message || 'Gagal untuk bergabung ke kelas.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Gabung Kelas Baru</h3>
      <p className="text-gray-600 mb-6">Masukkan kode kelas untuk mencari dan bergabung dengan kelas yang Anda tuju.</p>
      
      <div className="flex items-center space-x-4 mb-4">
        <input
          type="text"
          value={classCode}
          onChange={(e) => setClassCode(e.target.value.toUpperCase())}
          placeholder="Masukkan Kode Kelas"
          className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        <Button onClick={handleSearch} disabled={isLoading || !classCode.trim()}>
          {isLoading ? 'Mencari...' : 'Cari'}
        </Button>
      </div>

      {error && <p className="text-red-500 text-center my-4">{error}</p>}

      {classDetails && (
        <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <h4 className="text-xl font-semibold text-gray-900">{classDetails.name}</h4>
          <p className="text-gray-600 mt-2 mb-4">{classDetails.description}</p>
          
          {isMember ? (
            <div className="text-center p-4 bg-green-100 text-green-800 rounded-lg">
              Anda sudah menjadi anggota kelas ini.
            </div>
          ) : (
            <Button onClick={handleJoinClass} disabled={isLoading} className="w-full">
              {isLoading ? 'Bergabung...' : 'Gabung Sekarang'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default JoinClassWidget;
