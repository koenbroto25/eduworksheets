import React from 'react';
import { X, User, Calendar, BookOpen, Target, Play, Plus, HelpCircle, FileText } from 'lucide-react';
import { Exercise } from '../../types';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';

interface ExerciseDetailProps {
  exercise: Exercise;
  onClose: () => void;
  onUseExercise?: (exercise: Exercise) => void;
  onPractice?: (exercise: Exercise) => void;
}

export const ExerciseDetail: React.FC<ExerciseDetailProps> = ({
  exercise,
  onClose,
  onUseExercise,
  onPractice
}) => {
  const { user } = useAuth();

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
    all: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Exercise Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{exercise.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors[exercise.difficulty]}`}>
                {exercise.difficulty}
              </span>
            </div>
            
            <p className="text-gray-700 text-lg mb-6">{exercise.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium">Subject:</span>
                  <span className="ml-2">{exercise.subject}</span>
                </div>
                
                <div className="flex items-center">
                  <Target className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="font-medium">Grade Level:</span>
                  <span className="ml-2">Grade {exercise.grade}</span>
                </div>

                <div className="flex items-center">
                  <HelpCircle className="h-5 w-5 text-cyan-600 mr-2" />
                  <span className="font-medium">Question Types:</span>
                  <span className="ml-2">{exercise.question_types?.join(', ') || 'Not specified'}</span>
                </div>

                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="font-medium">Assessment Type:</span>
                  <span className="ml-2">{exercise.assessment_type}</span>
                </div>

                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-indigo-600 mr-2" />
                  <span className="font-medium">Curriculum Used:</span>
                  <span className="ml-2">{exercise.curriculum_type}</span>
                </div>
                
                {exercise.material && (
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium">Material:</span>
                    <span className="ml-2">{exercise.material}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-600 mr-2" />
                  <span className="font-medium">Created by:</span>
                  <span className="ml-2">{exercise.creatorName}</span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-600 mr-2" />
                  <span className="font-medium">Created:</span>
                  <span className="ml-2">{new Date(exercise.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center">
                  <Target className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium">Questions:</span>
                  <span className="ml-2">{exercise.questions.length} questions</span>
                </div>
              </div>
            </div>
            
            {exercise.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {exercise.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Sample Questions</h3>
            <div className="space-y-4">
              {exercise.questions && exercise.questions.length > 0 ? (
                <>
                  {exercise.questions.slice(0, 3).map((question, index) => (
                    <div key={question.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${difficultyColors[question.difficulty || 'medium']}`}>
                          {question.difficulty || 'medium'}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{question.question}</p>
                      {question.type === 'multiple-choice' && question.options && (
                        <div className="space-y-1">
                          {(question.options as string[]).map((option: string, optIndex: number) => (
                            <div key={optIndex} className="text-sm text-gray-600">
                              {String.fromCharCode(65 + optIndex)}. {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {exercise.questions.length > 3 && (
                    <p className="text-gray-600 text-center">
                      ... and {exercise.questions.length - 3} more questions
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No sample questions available for this exercise.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex gap-4">
              {user?.role === 'teacher' && onUseExercise && (
                <Button
                  onClick={() => onUseExercise(exercise)}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Use in My Class
                </Button>
              )}
              
              {onPractice && (
                <Button
                  onClick={() => onPractice(exercise)}
                  variant="outline"
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Practice This Exercise
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
