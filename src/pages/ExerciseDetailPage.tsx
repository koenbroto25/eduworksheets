import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { supabaseService } from '../services/supabaseService';
import { Exercise } from '../types';

const ExerciseDetailPage: React.FC = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!exerciseId) {
      setError('Exercise ID is missing.');
      setLoading(false);
      return;
    }

    const fetchExerciseDetails = async () => {
      try {
        const { data, error } = await supabaseService.getExerciseWithQuestions(supabase, exerciseId);

        if (error) {
          setError(error.message);
        } else if (data) {
          setExercise(data);
        } else {
          setError('Exercise not found.');
        }
      } catch (err) {
        setError('An unexpected error occurred while fetching the exercise.');
      } finally {
        setLoading(false);
      }
    };

    fetchExerciseDetails();
  }, [exerciseId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-600">{error}</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => navigate('/library')}
        >
          Back to Library
        </button>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Exercise Not Found</h1>
        <p className="text-gray-600">The exercise you are looking for does not exist.</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => navigate('/library')}
        >
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <button
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => navigate('/library')}
        >
          &larr; Back to Library
        </button>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{exercise.title}</h1>
        <p className="text-gray-600 mb-6">{exercise.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Subject</p>
            <p className="font-semibold">{exercise.subject}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Grade</p>
            <p className="font-semibold">{exercise.grade}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Difficulty</p>
            <p className="font-semibold capitalize">{exercise.difficulty}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Curriculum</p>
            <p className="font-semibold">{exercise.curriculum_type || 'Not specified'}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Question Types</p>
            <p className="font-semibold capitalize">
              {exercise.questions && exercise.questions.length > 0
                ? [...new Set(exercise.questions.map(q => q.type))].join(', ')
                : 'N/A'}
            </p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Total Questions</p>
            <p className="font-semibold">{exercise.questions?.length || 0}</p>
          </div>
        </div>

        {exercise.material && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Material</h2>
            <p>{exercise.material}</p>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Question Details</h2>
          <div className="space-y-6">
            {exercise.questions && exercise.questions.length > 0 ? (
              exercise.questions.map((question, index) => (
                <div key={question.id || index} className="p-4 border rounded-lg bg-gray-50">
                  <p className="font-semibold mb-2">
                    {index + 1}. {question.question}
                  </p>
                  {question.options && (
                    <ul className="list-disc list-inside pl-4">
                      {(question.options as string[]).map((option: string, i: number) => (
                        <li key={i} className="mb-1">{option}</li>
                      ))}
                    </ul>
                  )}
                   {question.type === 'sequencing' && question.items && (
                    <ul className="list-decimal list-inside pl-4 mt-2">
                      {question.answer.map((ans: string, i: number) => (
                        <li key={i} className="mb-1">{ans}</li>
                      ))}
                    </ul>
                  )}
                  {question.type === 'connecting-lines' && question.leftItems && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">Correct connections:</p>
                      <ul className="list-disc list-inside pl-4">
                        {Object.entries(question.answer).map(([left, right]: [string, any]) => (
                           <li key={left}>{question.leftItems![parseInt(left)]} &rarr; {right.map((r: number) => question.rightItems![r]).join(', ')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No questions found for this exercise.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetailPage;
