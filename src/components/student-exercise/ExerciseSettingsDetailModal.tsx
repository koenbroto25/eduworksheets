import React from 'react';
import { ClassExercise } from '../../types';
import { Button } from '../common/Button';
import { X } from 'lucide-react';

interface ExerciseSettingsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  classExercise: ClassExercise;
}

const ExerciseSettingsDetailModal: React.FC<ExerciseSettingsDetailModalProps> = ({
  isOpen,
  onClose,
  classExercise,
}) => {
  if (!isOpen) return null;

  const { exercise, due_date, max_attempts, minimum_passing_grade, time_limit, randomize_questions, show_answers_policy } = classExercise;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Tidak ditentukan';
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-1 text-gray-800">Aturan Pengerjaan</h2>
        <p className="text-gray-600 mb-6 border-b pb-4">"{exercise.title}"</p>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Tanggal Jatuh Tempo:</span>
            <span className="font-semibold text-gray-900">{formatDate(due_date)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Batas Percobaan:</span>
            <span className="font-semibold text-gray-900">{max_attempts ?? 'Tidak terbatas'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Batas Waktu:</span>
            <span className="font-semibold text-gray-900">
              {time_limit ? `${time_limit} menit` : 'Tidak terbatas'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Nilai Kelulusan Minimum:</span>
            <span className="font-semibold text-gray-900">{minimum_passing_grade ?? 'N/A'}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Pertanyaan Diacak:</span>
            <span className="font-semibold text-gray-900">{randomize_questions ? 'Ya' : 'Tidak'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Tampilkan Jawaban:</span>
            <span className="font-semibold text-gray-900">{show_answers_policy ?? 'Langsung'}</span>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button onClick={onClose} variant="primary">
            Mengerti
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseSettingsDetailModal;
