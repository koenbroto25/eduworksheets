import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';
import NotificationBell from '../common/NotificationBell';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const teacherNavItems = [
    { to: '/dashboard', label: 'Dasbor Saya' },
    { to: '/exercise-builder', label: 'Buat Latihan' },
    { to: '/library', label: 'Perpustakaan Latihan' },
    { to: '/classes', label: 'Manajemen Kelas' }
  ];

  const studentNavItems = [
    { to: '/dashboard', label: 'Dasbor Saya' },
    { to: '/library', label: 'Perpustakaan Latihan' },
    { to: '/classes', label: 'Kelas Saya' }
  ];

  const parentNavItems = [
    { to: '/dashboard', label: 'Dasbor Orang Tua' },
    { to: '/library', label: 'Perpustakaan Latihan' },
  ];

  const publicNavItems = [
    { to: '/for-teachers', label: 'Untuk Guru' },
    { to: '/for-students', label: 'Untuk Siswa' },
    { to: '/for-parents', label: 'Untuk Orang Tua' },
    { to: '/library', label: 'Perpustakaan' },
  ];

  const getNavItems = () => {
    if (!user) return publicNavItems;
    switch (user.role) {
      case 'teacher':
        return teacherNavItems;
      case 'student':
        return studentNavItems;
      case 'parent':
        return parentNavItems;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">EduWorksheets</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          {user ? (
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <span className="text-sm text-gray-700">
                Selamat datang, {user.name}
              </span>
              <div className="flex items-center space-x-2">
                <Link to="/profile">
                  <Button variant="ghost" size="sm" title="Profil">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/settings">
                  <Button variant="ghost" size="sm" title="Pengaturan">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} title="Keluar">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-x-2">
              <Link to="/login">
                <Button variant="outline" size="sm">Masuk</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Daftar</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
