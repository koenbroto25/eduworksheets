import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../services/supabaseClient';
import { Exercise } from '../types';
import { TakeExercise } from '../components/student-exercise/TakeExercise';
import { useAuth } from '../contexts/AuthContext';

const TakeExercisePage: React.FC = () => {
  const { exerciseId, classId } = useParams<{ exerciseId: string; classId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [classExerciseSettings, setClassExerciseSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [startTime] = useState(new Date().toISOString()); // Capture start time on component mount

  useEffect(() => {
    const fetchExerciseData = async () => {
      if (!exerciseId || !user) return;

      try {
        setLoading(true);
        // Fetch the core exercise details
        const { data: exerciseData, error: exerciseError } = await supabaseService.getExerciseWithQuestions(supabase, exerciseId);
        if (exerciseError) throw exerciseError;
        setExercise(exerciseData as Exercise);

        // If this is a class assignment, fetch its specific settings and attempts
        if (classId) {
          const { data: settingsData, error: settingsError } = await supabaseService.getClassExercise(supabase, classId, exerciseId);
          if (settingsError) throw settingsError;
          setClassExerciseSettings(settingsData);

          const { data: attemptsData, error: attemptsError } = await supabase
            .from('exercise_attempts')
            .select('*')
            .eq('user_id', user.id)
            .eq('class_exercise_id', settingsData.id)
            .eq('exercise_id', exerciseId);
          if (attemptsError) throw attemptsError;
          setAttempts(attemptsData || []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExerciseData();
  }, [exerciseId, classId, user]);

  const handleComplete = async (results: any) => {
    if (!user || !exercise) return;

    const queryParams = new URLSearchParams(location.search);
    const assignmentType = queryParams.get('assignment_type');

    const now = new Date().toISOString();
    const maxScore = 100; // Assuming a max score of 100 for now

    try {
      // Always save the attempt using the new, safe RPC function
      const attemptData = {
        user_id: user.id,
        exercise_id: exercise.id,
        class_exercise_id: classExerciseSettings?.id,
        answers: results.answers,
        score: results.score,
        max_score: maxScore,
        time_elapsed: results.timeElapsed,
        started_at: startTime, // Use the state variable to ensure it's never undefined
        completed_at: now,
        submitted_at: now,
      };

      const { error: attemptError } = await supabaseService.submitExerciseAttempt(supabase, attemptData);

      if (attemptError) throw attemptError;

      // If it's a parent assignment, update the parent_assignments table
      if (assignmentType === 'parent') {
        const { error: parentAssignmentError } = await supabase
          .from('parent_assignments')
          .update({
            completed_at: new Date().toISOString(),
            score: results.score,
          })
          .eq('child_id', user.id)
          .eq('exercise_id', exercise.id);
        
        if (parentAssignmentError) throw parentAssignmentError;
      }

    } catch (err: any) {
      console.error('Error saving attempt:', err);
    }
  };

  const handleBack = () => {
    if (exercise && exercise.class_id) {
      navigate(`/class/${exercise.class_id}/exercises`);
    } else {
      navigate('/library');
    }
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

  if (!exercise) {
    return <div className="text-center py-12 text-gray-500">Latihan tidak ditemukan.</div>;
  }

  // Rule Enforcement
  if (classId && classExerciseSettings) {
    if (classExerciseSettings.due_date && new Date(classExerciseSettings.due_date) < new Date()) {
      return <div className="text-center py-12 text-red-600">Tenggat waktu untuk latihan ini telah berlalu.</div>;
    }
    if (classExerciseSettings.max_attempts && attempts.length >= classExerciseSettings.max_attempts) {
      return <div className="text-center py-12 text-red-600">Anda telah mencapai batas maksimal pengerjaan untuk latihan ini.</div>;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <TakeExercise
        exercise={exercise}
        onComplete={handleComplete}
        onBack={handleBack}
        classExerciseSettings={classExerciseSettings}
      />
    </div>
  );
};

export default TakeExercisePage;
