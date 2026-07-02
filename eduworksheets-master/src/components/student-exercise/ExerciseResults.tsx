import React from 'react';
import { ArrowLeft, CheckCircle, RotateCcw, XCircle } from 'lucide-react';
import { Exercise } from '../../types';
import { Button } from '../common/Button';
import { QuestionRenderer } from '../exercise-builder/QuestionRenderer';

interface ExerciseResultsProps {
  exercise: Exercise;
  userAnswers: any[];
  timeElapsed: number;
  onRestart: () => void;
  onBack: () => void;
  minimumPassingGrade?: number;
}

export const ExerciseResults: React.FC<ExerciseResultsProps> = ({
  exercise,
  userAnswers,
  timeElapsed,
  onRestart,
  onBack,
  minimumPassingGrade = 80, // Default passing grade if not provided
}) => {
  const calculateScore = () => {
    const correctAnswers = userAnswers.filter((ans, i) => {
      const question = exercise.questions[i];
      if (question.type === 'connecting-lines' || question.type === 'sequencing') {
        return JSON.stringify(ans) === JSON.stringify(question.answer);
      }
      return ans === question.answer;
    }).length;
    return Math.round((correctAnswers / exercise.questions.length) * 100);
  };

  const getCorrectAnswersCount = () => {
    return userAnswers.filter((ans, i) => {
      const question = exercise.questions[i];
      if (question.type === 'connecting-lines' || question.type === 'sequencing') {
        return JSON.stringify(ans) === JSON.stringify(question.answer);
      }
      return ans === question.answer;
    }).length;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const score = calculateScore();
  const correctAnswersCount = getCorrectAnswersCount();
  const isPassed = score >= minimumPassingGrade;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Results Summary */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          {isPassed ? (
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          ) : (
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isPassed ? 'Exercise Passed!' : 'Exercise Not Passed'}
          </h1>
          <p className="text-gray-600">
            {isPassed
              ? `Congratulations! You've passed "${exercise.title}".`
              : `You have completed "${exercise.title}", but did not meet the passing grade.`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">{score}%</div>
            <div className="text-sm text-blue-800">Final Score</div>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {correctAnswersCount}/{exercise.questions.length}
            </div>
            <div className="text-sm text-green-800">Correct Answers</div>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">{formatTime(timeElapsed)}</div>
            <div className="text-sm text-purple-800">Time Taken</div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={onRestart}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exercises
          </Button>
        </div>
      </div>

      {/* Detailed Review */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Review Your Answers</h2>
        <div className="space-y-4">
          {exercise.questions.map((question, index) => (
            <div key={question.id || index} className="bg-white rounded-xl shadow-lg p-6">
              <QuestionRenderer
                question={question}
                userAnswer={userAnswers[index]}
                onAnswer={() => {}} // No-op, answers are final
                isSubmitted={true}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
