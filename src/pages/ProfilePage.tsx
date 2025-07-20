import React, { useState } from 'react';
import { User, Mail, Calendar, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const handleSave = () => {
    if (formData.name.trim() && formData.email.trim()) {
      updateUser(formData);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-white" />
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-blue-100 capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Personal Information
            </h3>
            {!isEditing ? (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-900">{user.name}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-900">{user.email}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900 capitalize">{user.role}</span>
              </div>
            </div>

            {user.role === 'student' && user.child_code && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Unique Code
                </label>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900 font-mono tracking-widest">{user.child_code}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(user.child_code || '');
                      alert('Code copied to clipboard!');
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Member Since
              </label>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Account Statistics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {user.role === 'teacher' ? '12' : '24'}
            </div>
            <div className="text-sm text-blue-800">
              {user.role === 'teacher' ? 'Exercises Created' : 'Exercises Completed'}
            </div>
          </div>
          
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {user.role === 'teacher' ? '3' : '5'}
            </div>
            <div className="text-sm text-green-800">
              {user.role === 'teacher' ? 'Active Classes' : 'Classes Joined'}
            </div>
          </div>
          
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {user.role === 'teacher' ? '87%' : '85%'}
            </div>
            <div className="text-sm text-purple-800">
              {user.role === 'teacher' ? 'Student Success Rate' : 'Average Score'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
