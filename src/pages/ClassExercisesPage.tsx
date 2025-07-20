import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { ClassExercise } from '../types';
import { ExerciseList } from '../components/student-exercise/ExerciseList';
import ExerciseSettingsDetailModal from '../components/student-exercise/ExerciseSettingsDetailModal';
import { useAuth } from '../contexts/AuthContext';

const ClassExercisesPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classExercises, setClassExercises] = useState<ClassExercise[]>([]);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ClassExercise | null>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      if (!classId || !user) return;

      try {
        setLoading(true);

        // Fetch class exercises with exercise details
        const { data: classExercisesData, error: classExercisesError } = await supabase
          .from('class_exercises')
          .select('*, exercise:exercises(*)')
          .eq('class_id', classId);

        if (classExercisesError) throw classExercisesError;

        // Fetch user's completed exercises
        const { data: attempts, error: attemptsError } = await supabase
          .from('exercise_attempts')
          .select('exercise_id')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        if (attemptsError) throw attemptsError;

        setClassExercises(classExercisesData || []);
        setCompletedExercises(attempts?.map((a: { exercise_id: string }) => a.exercise_id) || []);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [classId, user]);

  const handleStartExercise = (exercise: ClassExercise) => {
    navigate(`/class/${classId}/exercise/${exercise.exercise_id}/take`);
  };

  const handleViewSettings = (classExercise: ClassExercise) => {
    setSelectedExercise(classExercise);
    setIsSettingsModalOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsModalOpen(false);
    setSelectedExercise(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ExerciseList
        classExercises={classExercises}
        onStartExercise={handleStartExercise}
        completedExercises={completedExercises}
        onViewSettings={handleViewSettings}
      />
      {selectedExercise && (
        <ExerciseSettingsDetailModal
          isOpen={isSettingsModalOpen}
          onClose={handleCloseSettings}
          classExercise={selectedExercise}
        />
      )}
    </div>
  );
};

export default ClassExercisesPage;
