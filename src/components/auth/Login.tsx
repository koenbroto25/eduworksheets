import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isActionLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || authLoading) return;
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const { user } = await login(email, password);
      
      // Redirect based on role
      if (user?.role === 'student') {
        navigate('/student-dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      // isActionLoading from context will handle the button's loading state.
      // We only need to manage the local isSubmitting state if we want to prevent double-clicks
      // even before the async action starts, but since we check authLoading, it's redundant.
      // Let's rely on the context's loading state.
      setIsSubmitting(false); // Resetting local submission state.
    }
  };

  const isFormDisabled = isSubmitting || authLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <BookOpen className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Masuk ke EduWorksheets
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Akses ruang kerja pendidikan Anda
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <Input
              label="Alamat Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Masukkan email Anda"
              disabled={isFormDisabled}
            />
            
            <Input
              label="Kata Sandi"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Masukkan kata sandi Anda"
              disabled={isFormDisabled}
            />
            
            <Button
              type="submit"
              className="w-full"
              disabled={isFormDisabled}
            >
              {isFormDisabled ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Masuk...
                </div>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Belum punya akun?{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                Daftar di sini
              </Link>
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
};
