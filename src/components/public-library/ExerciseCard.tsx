import React, { useState } from 'react';
import { Eye, User, Calendar, BookOpen, Share2, Play, Settings } from 'lucide-react';
import { Exercise, FlatClassExercise } from '../../types';
import { Button } from '../common/Button';
import { AssignToClassModal } from '../classroom/AssignToClassModal';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShareMenu } from '../common/ShareMenu';

interface ExerciseCardProps {
  exercise: Exercise | FlatClassExercise;
  onView: (exercise: Exercise | FlatClassExercise) => void;
  onDeleteExercise?: (exerciseId: string) => void;
  isCreator: boolean;
  onAssignToChild?: (exercise: Exercise | FlatClassExercise) => void;
  context?: 'classDetail' | 'library' | 'dashboard';
  onOpenSettings?: (exercise: FlatClassExercise) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onView,
  onDeleteExercise,
  isCreator,
  onAssignToChild,
  context = 'library',
  onOpenSettings,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const difficultyColors: { [key: string]: string } = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  };

  // This is the definitive exercise ID, whether it's a public exercise (id) or a class assignment (exercise_id)
  const exerciseId = 'exercise_id' in exercise ? exercise.exercise_id : exercise.id;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {exercise.title || (exercise as any).exercise_title}
          </h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              difficultyColors[exercise.difficulty]
            }`}
          >
            {exercise.difficulty === 'easy' ? 'Mudah' : exercise.difficulty === 'medium' ? 'Sedang' : 'Sulit'}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {exercise.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {exercise.grade}
          </span>
          {exercise.semester && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Semester {exercise.semester}
            </span>
          )}
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <BookOpen className="h-3 w-3 mr-1.5" />
            {exercise.subject}
          </span>
          {exercise.questions && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
              {exercise.questions.length} Soal
            </span>
          )}
          {exercise.assessment_type && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {exercise.assessment_type}
            </span>
          )}
          {exercise.curriculum_type && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
              {exercise.curriculum_type}
            </span>
          )}
          {exercise.material && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
              {exercise.material}
            </span>
          )}
          {exercise.metadata?.sub_topic && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
              {exercise.metadata.sub_topic}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            {exercise.creatorName}
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date(exercise.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {context === 'classDetail' && onOpenSettings ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenSettings(exercise as FlatClassExercise)}
              className="flex-1"
            >
              <Settings className="h-4 w-4 mr-1" />
              Pengaturan
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(exercise)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              Lihat Detail
            </Button>
          )}

          {user?.role === 'teacher' && context !== 'classDetail' && (
            <Button
              size="sm"
              onClick={() => setIsAssignModalOpen(true)}
              className="flex-1"
            >
              + Gunakan di Kelas Saya
            </Button>
          )}
          {user?.role === 'parent' && onAssignToChild && (
            <Button
              size="sm"
              onClick={() => onAssignToChild(exercise)}
              className="flex-1"
            >
              + Tugaskan ke Anak Saya
            </Button>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (context === 'classDetail' && onView) {
                onView(exercise);
              } else {
                navigate(`/take-exercise/${exerciseId}`);
              }
            }}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-1" />
            Latihan
          </Button>
          <div className="relative flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Bagikan
            </Button>
            {isShareMenuOpen && (
              <ShareMenu
                url={`${window.location.origin}/take-exercise/${exerciseId}`}
                title={exercise.title || (exercise as any).exercise_title}
                onClose={() => setIsShareMenuOpen(false)}
              />
            )}
          </div>
        </div>
        {isCreator && onDeleteExercise && (
          <div className="mt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDeleteExercise(exerciseId)}
              className="w-full"
            >
              Hapus
            </Button>
          </div>
        )}
      </div>
      {isAssignModalOpen && (
        <AssignToClassModal
          exercise={exercise}
          onClose={() => setIsAssignModalOpen(false)}
          onAssign={async (selectedClassIds) => {
            if (!user) {
              alert('You must be logged in to assign exercises.');
              return;
            }

            const assignments = selectedClassIds.map((classId) => {
              const dueDate = new Date();
              dueDate.setDate(dueDate.getDate() + 7); // Set due date to 7 days from now
              return {
                class_id: classId,
                exercise_id: exerciseId,
                due_date: dueDate.toISOString(),
              };
            });

            const { error } = await supabase
              .from('class_exercises')
              .insert(assignments);

            if (error) {
              console.error('Error assigning exercise to classes:', error);
              alert(`Gagal menugaskan latihan: ${error.message}`);
            } else {
              alert('Latihan berhasil ditugaskan!');
              setIsAssignModalOpen(false);
            }
          }}
        />
      )}
    </div>
  );
};
