import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LinkIcon, AlertCircle, CheckCircle, UserSearch, UserPlus } from 'lucide-react';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../services/supabaseClient';

interface FoundChild {
  id: string;
  name: string;
  avatar_url: string;
}

export const LinkChildPage: React.FC = () => {
  const [childCode, setChildCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [foundChild, setFoundChild] = useState<FoundChild | null>(null);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFoundChild(null);
    setIsLoading(true);

    if (!childCode.trim()) {
      setError('Kode Anak harus diisi.');
      setIsLoading(false);
      return;
    }

    if (!user) {
      setError('Anda harus masuk untuk menautkan akun.');
      setIsLoading(false);
      return;
    }

    try {
      const { data: childProfile, error: findError } = await supabaseService.findChildByCode(supabase, childCode.trim());

      if (findError) {
        throw findError;
      }

      if (!childProfile) {
        throw new Error('Kode Anak tidak valid atau tidak ditemukan.');
      }
      
      const { data: isLinked, error: linkCheckError } = await supabaseService.isChildLinked(supabase, childProfile.id, user.id);

      if (linkCheckError) {
        throw linkCheckError;
      }

      if (isLinked) {
        throw new Error('Akun Anda sudah tertaut dengan siswa ini.');
      }

      setFoundChild(childProfile);

    } catch (err: any) {
      console.error('Failed to find child:', err);
      setError(err.message || 'Gagal mencari akun anak. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLink = async () => {
    if (!user || !foundChild) {
      setError('Terjadi kesalahan. Silakan coba cari lagi.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: linkError } = await supabaseService.linkParentToChild(supabase, user.id, foundChild.id);

      if (linkError) {
        throw linkError;
      }

      await refreshUser();

      setSuccess('Akun berhasil ditautkan! Anda akan dialihkan ke dasbor.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err: any) {
      console.error('Failed to link child account:', err);
      setError(err.message || 'Gagal menautkan akun. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setChildCode('');
    setError('');
    setSuccess('');
    setFoundChild(null);
    setIsLoading(false);
  };

  const renderSearchForm = () => (
    <form onSubmit={handleSearch} className="space-y-6">
      <Input
        label="Kode Anak"
        name="childCode"
        value={childCode}
        onChange={(e) => setChildCode(e.target.value.toUpperCase())}
        required
        placeholder="Masukkan 6 digit kode"
        disabled={isLoading}
        maxLength={6}
      />
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
        icon={<UserSearch size={18} />}
      >
        {isLoading ? 'Mencari...' : 'Cari Akun Anak'}
      </Button>
    </form>
  );

  const renderConfirmation = () => (
    <div className="space-y-6 text-center">
      <p className="text-gray-600">Apakah ini anak yang benar?</p>
      <div className="flex items-center justify-center space-x-4 p-4 bg-gray-100 rounded-lg">
        <div className="avatar">
          <div className="w-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
            <img src={foundChild!.avatar_url || `https://ui-avatars.com/api/?name=${foundChild!.name}&background=random`} alt="Avatar Anak" />
          </div>
        </div>
        <span className="text-xl font-bold text-gray-800">{foundChild!.name}</span>
      </div>
      <div className="flex gap-4">
        <Button 
          onClick={handleReset}
          className="w-full" 
          variant="outline"
          disabled={isLoading}
        >
          Bukan, Cari Lagi
        </Button>
        <Button 
          onClick={handleLink}
          className="w-full" 
          disabled={isLoading}
          icon={<UserPlus size={18} />}
        >
          {isLoading ? 'Menautkan...' : 'Ya, Tautkan Akun'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <LinkIcon className="h-12 w-12 text-blue-600 mx-auto" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Tautkan Akun Anak Anda
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {foundChild 
              ? 'Konfirmasi untuk menautkan akun di bawah ini.'
              : 'Masukkan "Kode Anak" yang terdapat di halaman profil anak Anda.'
            }
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start mb-6">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">Gagal</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start mb-6">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Berhasil</p>
                <p className="text-sm text-green-700 mt-1">{success}</p>
              </div>
            </div>
          )}

          {!success && (foundChild ? renderConfirmation() : renderSearchForm())}
        </div>
      </div>
    </div>
  );
};
