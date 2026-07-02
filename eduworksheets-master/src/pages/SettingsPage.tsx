import React, { useState, useEffect } from 'react';
import { Settings, Bell, Shield, Palette, Globe, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';

export const SettingsPage: React.FC = () => {
  const { user, updateUserSettings, isActionLoading } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      exerciseReminders: true,
      classUpdates: true
    },
    privacy: {
      profileVisible: true,
      exercisesPublic: true, // Default to true as requested
      allowMessages: true
    },
    preferences: {
      theme: 'light',
      language: 'id', // Default to Indonesian
      timezone: 'Asia/Jakarta'
    }
  });
  const [saveStatus, setSaveStatus] = useState<'' | 'success' | 'error'>('');

  useEffect(() => {
    // Use user.preferences instead of user.settings
    if (user?.preferences) {
      // Deep merge to avoid losing new settings if they aren't in the DB yet
      setSettings(prev => ({
        notifications: { ...prev.notifications, ...(user.preferences as any).notifications },
        privacy: { ...prev.privacy, ...(user.preferences as any).privacy },
        preferences: { ...prev.preferences, ...(user.preferences as any).preferences },
      }));
    }
  }, [user]);

  const handleSave = async () => {
    setSaveStatus('');
    try {
      await updateUserSettings(settings);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000); // Hide message after 3 seconds
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Silakan masuk untuk mengakses pengaturan.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pengaturan</h1>
          <p className="text-gray-600">Kelola preferensi akun Anda</p>
        </div>
        <div className="flex items-center space-x-4">
          {saveStatus === 'success' && <p className="text-green-600">Pengaturan disimpan!</p>}
          {saveStatus === 'error' && <p className="text-red-600">Gagal menyimpan.</p>}
          <Button onClick={handleSave} disabled={isActionLoading}>
            {isActionLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Notifikasi */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Bell className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Notifikasi</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Notifikasi Email</h3>
              <p className="text-sm text-gray-600">Terima notifikasi melalui email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) => updateSetting('notifications', 'email', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Pengingat Latihan</h3>
              <p className="text-sm text-gray-600">Dapatkan pengingat tentang latihan yang tertunda</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.exerciseReminders}
                onChange={(e) => updateSetting('notifications', 'exerciseReminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Pembaruan Kelas</h3>
              <p className="text-sm text-gray-600">Notifikasi tentang aktivitas kelas</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.classUpdates}
                onChange={(e) => updateSetting('notifications', 'classUpdates', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Privasi */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Shield className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Privasi</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Profil Publik</h3>
              <p className="text-sm text-gray-600">Jadikan profil Anda terlihat oleh pengguna lain</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.privacy.profileVisible}
                onChange={(e) => updateSetting('privacy', 'profileVisible', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {user.role === 'teacher' && (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Latihan Publik</h3>
                <p className="text-sm text-gray-600">Izinkan orang lain menggunakan latihan Anda</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.privacy.exercisesPublic}
                  onChange={(e) => updateSetting('privacy', 'exercisesPublic', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Izinkan Pesan</h3>
              <p className="text-sm text-gray-600">Biarkan pengguna lain mengirimi Anda pesan</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.privacy.allowMessages}
                onChange={(e) => updateSetting('privacy', 'allowMessages', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Preferensi */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Palette className="h-6 w-6 text-purple-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Preferensi</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tema
            </label>
            <select
              value={settings.preferences.theme}
              onChange={(e) => updateSetting('preferences', 'theme', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="light">Terang</option>
              <option value="dark">Gelap</option>
              <option value="auto">Otomatis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bahasa
            </label>
            <select
              value={settings.preferences.language}
              onChange={(e) => updateSetting('preferences', 'language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="id">Bahasa Indonesia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zona Waktu
            </label>
            <select
              value={settings.preferences.timezone}
              onChange={(e) => updateSetting('preferences', 'timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="UTC">UTC</option>
              <option value="Asia/Jakarta">Waktu Indonesia Barat (WIB)</option>
              <option value="Asia/Makassar">Waktu Indonesia Tengah (WITA)</option>
              <option value="Asia/Jayapura">Waktu Indonesia Timur (WIT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tindakan Akun */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Settings className="h-6 w-6 text-red-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Tindakan Akun</h2>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-medium text-red-800 mb-2">Hapus Akun</h3>
            <p className="text-sm text-red-700 mb-3">
              Hapus akun Anda dan semua data terkait secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
              Hapus Akun
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
