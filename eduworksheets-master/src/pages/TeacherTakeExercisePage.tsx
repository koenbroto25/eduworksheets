import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FullClassExercise, Question } from '../types';
import { useAuth } from '../hooks/useAuth';
import { supabaseService } from '../services/supabaseService';
import { QuestionRenderer } from '../components/exercise-builder/QuestionRenderer';
import { Button } from '../components/common/Button';
import { ExerciseResults } from '../components/student-exercise/ExerciseResults';

// This page is specifically for teachers to view or take an exercise within their class context.
export const TeacherTakeExercisePage: React.FC = () => {
  const { classId, exerciseId } = useParams<{ classId: string; exerciseId: string }>();
  const { supabase } = useAuth();
  const [exercise, setExercise] = useState<FullClassExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const fetchExerciseForTeacher = async () => {
      if (!exerciseId || !classId || !supabase) {
        setError("Invalid parameters for fetching exercise.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      // Use the new, secure RPC function
      const { data, error: rpcError } = await supabaseService.getClassExerciseDetailsForTeacher(supabase, classId, exerciseId);

      if (rpcError) {
        console.error('Error fetching exercise details for teacher:', rpcError);
        setError(rpcError.message || 'Failed to load exercise. You may not have permission to view this.');
        setExercise(null);
      } else if (data) {
        // The data from RPC is already a complete exercise object, just cast it
        const fullExerciseData = data as FullClassExercise;
        
        // Ensure questions is an array, even if null from DB
        fullExerciseData.questions = fullExerciseData.questions || [];

        // Sort questions by order_index
        fullExerciseData.questions.sort((a: Question, b: Question) => (a.order_index || 0) - (b.order_index || 0));
        
        setExercise(fullExerciseData);
      }
      setLoading(false);
    };

    fetchExerciseForTeacher();
  }, [classId, exerciseId, supabase]);

  useEffect(() => {
    if (!submitted) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [submitted]);

  const handleAnswerChange = (questionIndex: number, answer: any) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleRestart = () => {
    setAnswers([]);
    setSubmitted(false);
    setTimeElapsed(0);
  };

  if (loading) {
    return <div className="text-center p-8">Loading exercise...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  if (!exercise) {
    return <div className="text-center p-8">Exercise not found or access denied.</div>;
  }

  if (submitted) {
    return (
      <div className="container mx-auto p-4">
        <ExerciseResults
          exercise={exercise}
          userAnswers={answers}
          timeElapsed={timeElapsed}
          onRestart={handleRestart}
          onBack={() => window.history.back()}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{exercise.title}</h1>
      <p className="text-gray-600 mb-6">{exercise.description}</p>

      <div>
        {exercise.questions && exercise.questions.length > 0 ? (
          exercise.questions.map((question, index) => (
            <div key={question.id || index} className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
              <QuestionRenderer
                question={question}
                userAnswer={answers[index]}
                onAnswer={(answer) => handleAnswerChange(index, answer)}
                isSubmitted={submitted}
              />
            </div>
          ))
        ) : (
          <p>No questions found for this exercise.</p>
        )}
        {exercise.questions && exercise.questions.length > 0 && (
          <Button onClick={handleSubmit}>Submit Answers</Button>
        )}
      </div>
    </div>
  );
};
