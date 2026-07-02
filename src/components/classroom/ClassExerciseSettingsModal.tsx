import React, { useState, useEffect } from 'react';
import { FlatClassExercise, FullClassExercise, ShowAnswersPolicy } from '../../types';

interface ClassExerciseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: Partial<FullClassExercise>) => void;
  exerciseData: FlatClassExercise | FullClassExercise | null;
  isLoading: boolean;
}

const ClassExerciseSettingsModal: React.FC<ClassExerciseSettingsModalProps> = ({
  exerciseData,
  isOpen,
  onClose,
  onSave,
  isLoading,
}) => {
  const [dueDate, setDueDate] = useState('');
  const [maxAttempts, setMaxAttempts] = useState<number | ''>('');
  const [timeLimit, setTimeLimit] = useState<number | ''>('');
  const [minimumPassingGrade, setMinimumPassingGrade] = useState<number>(70);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [showAnswersPolicy, setShowAnswersPolicy] = useState<ShowAnswersPolicy>('Immediately');

  useEffect(() => {
    if (exerciseData) {
      const EData = exerciseData as FullClassExercise; // Cast to Full type to access all potential properties
      setDueDate(EData.due_date ? new Date(EData.due_date).toISOString().split('T')[0] : '');
      setMaxAttempts(EData.max_attempts ?? '');
      setTimeLimit(EData.time_limit ?? '');
      setMinimumPassingGrade(EData.minimum_passing_grade ?? 70);
      setRandomizeQuestions(EData.randomize_questions ?? false);
      setShowAnswersPolicy(EData.show_answers_policy ?? 'Immediately');
    }
  }, [exerciseData]);

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const settings: Partial<FullClassExercise> = {
      due_date: dueDate || null,
      max_attempts: maxAttempts === '' ? null : Number(maxAttempts),
      minimum_passing_grade: Number(minimumPassingGrade),
      time_limit: timeLimit === '' ? null : Number(timeLimit),
      randomize_questions: randomizeQuestions,
      show_answers_policy: showAnswersPolicy,
    };
    onSave(settings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Pengaturan untuk: {exerciseData?.title || 'Memuat...'}</h2>
        
        {isLoading ? (
          <div className="text-center py-10">
            <p>Memuat detail pengaturan...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-4"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Availability Section */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold border-b pb-2 mb-2">Ketersediaan</h3>
              <label htmlFor="due-date" className="block text-sm font-medium text-gray-700">Tanggal Jatuh Tempo</label>
              <input
                type="date"
                id="due-date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Rules & Grading Section */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold border-b pb-2 mb-2">Aturan & Penilaian</h3>
              <label htmlFor="max-attempts" className="block text-sm font-medium text-gray-700">Batas Percobaan (kosongkan untuk tanpa batas)</label>
              <input
                type="number"
                id="max-attempts"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Tanpa batas"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              
              <label htmlFor="time-limit" className="block text-sm font-medium text-gray-700 mt-2">Batas Waktu (Menit, kosongkan untuk tanpa batas)</label>
              <input
                type="number"
                id="time-limit"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Tanpa batas waktu"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />

              <label htmlFor="passing-grade" className="block text-sm font-medium text-gray-700 mt-2">Nilai Kelulusan Minimum: {minimumPassingGrade}%</label>
              <input
                type="range"
                id="passing-grade"
                min="0"
                max="100"
                value={minimumPassingGrade}
                onChange={(e) => setMinimumPassingGrade(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Student Experience Section */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold border-b pb-2 mb-2">Pengalaman Siswa</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="randomize-questions"
                  checked={randomizeQuestions}
                  onChange={(e) => setRandomizeQuestions(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="randomize-questions" className="ml-2 block text-sm text-gray-900">Acak Pertanyaan</label>
              </div>
              
              <label htmlFor="show-answers" className="block text-sm font-medium text-gray-700 mt-2">Kebijakan Tampilkan Jawaban</label>
              <select
                id="show-answers"
                value={showAnswersPolicy}
                onChange={(e) => setShowAnswersPolicy(e.target.value as ShowAnswersPolicy)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="Immediately">Langsung</option>
                <option value="After Deadline">Setelah Jatuh Tempo</option>
                <option value="On Max Attempts">Saat Batas Percobaan Tercapai</option>
                <option value="Manual">Manual</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Batal</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Simpan Perubahan</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ClassExerciseSettingsModal;
