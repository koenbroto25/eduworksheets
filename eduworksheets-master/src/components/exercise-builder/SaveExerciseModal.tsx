import React, { useState, useEffect } from 'react';
import { X, Save, BookOpen } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Exercise } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface SaveExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (finalExerciseData: any) => void;
  exerciseData: any;
  onExerciseDataChange: (data: any) => void;
}

export const SaveExerciseModal: React.FC<SaveExerciseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  exerciseData,
  onExerciseDataChange,
}) => {
  const { user } = useAuth();
  const [localExerciseData, setLocalExerciseData] = useState(exerciseData);

  useEffect(() => {
    setLocalExerciseData({
      ...exerciseData,
      is_public: exerciseData.is_public ?? true,
    });
  }, [exerciseData]);

  const handleChange = (field: string, value: any) => {
    setLocalExerciseData((prev: any) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  const handleSave = () => {
    if (!localExerciseData.title) {
      alert('Harap berikan judul untuk latihan ini.');
      return;
    }
    
    // Merge the local data (title, description, etc.) with the main exercise data
    const finalExerciseData = {
      ...exerciseData,
      ...localExerciseData,
    };
    
    onSave(finalExerciseData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">Finalisasi & Simpan Latihan</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800">Detail Latihan</h4>
              <Input
                label="Judul Latihan"
                value={localExerciseData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Masukkan judul yang jelas dan deskriptif"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  value={localExerciseData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Berikan deskripsi singkat tentang latihan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>
              <Input
                label="Nilai Kelulusan Minimum"
                type="number"
                value={localExerciseData.minimum_passing_grade || ''}
                onChange={(e) => handleChange('minimum_passing_grade', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                placeholder="contoh: 75"
              />
              <div className="flex items-center">
                <input
                  id="is_public"
                  name="is_public"
                  type="checkbox"
                  checked={localExerciseData.is_public || false}
                  onChange={(e) => handleChange('is_public', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                  Jadikan latihan ini publik
                </label>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800">Pratinjau Kartu</h4>
              <div className="border border-gray-200 rounded-lg p-4 shadow-md bg-white">
                <div className="flex items-center mb-2">
                  <div className="p-2 bg-blue-100 rounded-full mr-3">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <h5 className="text-md font-bold text-gray-800 truncate">{localExerciseData.title || 'Judul Latihan'}
                  </h5>
                </div>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                  {localExerciseData.description || 'Deskripsi latihan akan muncul di sini...'}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                    {exerciseData.grade ? `Kelas ${exerciseData.grade}` : 'N/A'}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                    {exerciseData.subject || 'N/A'}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                    {exerciseData.difficulty || 'N/A'}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-3">
                  Oleh {user?.name || '...'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end">
          <Button onClick={handleSave} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {localExerciseData.is_public ? 'Simpan dan Publikasikan' : 'Simpan sebagai Draf'}
          </Button>
        </div>
      </div>
    </div>
  );
};
