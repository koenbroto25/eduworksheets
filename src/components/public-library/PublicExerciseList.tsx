import React, { useState } from 'react';
import { Exercise } from '../../types';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseDetail } from './ExerciseDetail';
import { Pagination } from '../common/Pagination';

interface PublicExerciseListProps {
  exercises: Exercise[];
  onUseExercise?: (exercise: Exercise) => void;
  onPractice?: (exercise: Exercise) => void;
  onDeleteExercise?: (exerciseId: string) => void;
  userId?: string;
  onAssignToChild?: (exercise: Exercise) => void;
}

export const PublicExerciseList: React.FC<PublicExerciseListProps> = ({
  exercises,
  onUseExercise,
  onPractice,
  onDeleteExercise,
  userId,
  onAssignToChild,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const itemsPerPage = 12;
  const totalPages = Math.ceil(exercises.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentExercises = exercises.slice(startIndex, startIndex + itemsPerPage);

  const handleUseExercise = (exercise: Exercise) => {
    setSelectedExercise(null);
    onUseExercise?.(exercise);
  };

  const handlePractice = (exercise: Exercise) => {
    setSelectedExercise(null);
    onPractice?.(exercise);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentExercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onView={setSelectedExercise}
            onDeleteExercise={onDeleteExercise}
            isCreator={exercise.creator_id === userId}
            onAssignToChild={onAssignToChild}
          />
        ))}
      </div>

      {currentExercises.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No exercises found matching your criteria.</p>
          <p className="text-gray-400">Try adjusting your search or filters.</p>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="mt-8"
        />
      )}

      {selectedExercise && (
        <ExerciseDetail
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
          onUseExercise={onUseExercise ? handleUseExercise : undefined}
          onPractice={onPractice ? handlePractice : undefined}
        />
      )}
    </div>
  );
};
