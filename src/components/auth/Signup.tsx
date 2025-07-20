import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    // Client-side validation
    if (!formData.name.trim()) {
      setError('Nama harus diisi');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email harus diisi');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Silakan masukkan alamat email yang valid');
      return;
    }

    if (formData.password.length < 6) {
      setError('Kata sandi minimal harus 6 karakter');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Kata sandi tidak cocok');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Starting signup process with data:', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role
      });
      
      await signup(formData.email.trim(), formData.password, {
        name: formData.name.trim(),
        role: formData.role
      });
      
      console.log('Signup completed successfully');
      setSuccess(true);
      
      // Show success message and redirect after delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err: any) {
      console.error('Signup failed:', err);
      
      // Handle specific error cases
      let errorMessage = 'Gagal membuat akun. Silakan coba lagi.';
      
      if (err.message) {
        if (err.message.includes('already registered') || err.message.includes('already exists')) {
          errorMessage = 'Akun dengan email ini sudah terdaftar. Silakan coba masuk.';
        } else if (err.message.includes('invalid email')) {
          errorMessage = 'Silakan masukkan alamat email yang valid';
        } else if (err.message.includes('weak password')) {
          errorMessage = 'Kata sandi terlalu lemah. Silakan pilih kata sandi yang lebih kuat minimal 6 karakter.';
        } else if (err.message.includes('Database error')) {
          errorMessage = 'Masalah koneksi database. Silakan periksa koneksi internet Anda dan coba lagi.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Akun Berhasil Dibuat!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Anda sekarang dapat masuk dengan kredensial Anda
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-medium">Selamat Datang di EduWorksheets!</p>
                <p className="text-green-700 text-sm mt-1">
                  Akun Anda telah berhasil dibuat. Mengalihkan ke halaman masuk...
                </p>
              </div>
              
              <Button onClick={() => navigate('/login')} className="w-full">
                Lanjutkan ke Halaman Masuk
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <BookOpen className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Buat akun Anda
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Bergabunglah dengan komunitas EduWorksheets
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">Kesalahan</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <Input
              label="Nama Lengkap"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Masukkan nama lengkap Anda"
              disabled={isLoading}
            />
            
            <Input
              label="Alamat Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Masukkan email Anda"
              disabled={isLoading}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peran
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="student">Siswa</option>
                <option value="teacher">Guru</option>
                <option value="parent">Orang Tua</option>
              </select>
            </div>
            
            <Input
              label="Kata Sandi"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Buat kata sandi (min. 6 karakter)"
              disabled={isLoading}
            />
            
            <Input
              label="Konfirmasi Kata Sandi"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Konfirmasi kata sandi Anda"
              disabled={isLoading}
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Membuat Akun...
                </div>
              ) : (
                'Buat Akun'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Masuk di sini
              </Link>
            </p>
          </div>
          
          {isLoading && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 text-center">
                Membuat akun Anda... Ini mungkin memakan waktu beberapa detik.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
