import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Clock, RotateCcw } from 'lucide-react';
import { Button } from '../common/Button';
import { QuestionRenderer } from '../exercise-builder/QuestionRenderer';
import { Exercise } from '../../types';
import { ExerciseResults } from './ExerciseResults';

interface TakeExerciseProps {
  exercise: Exercise;
  onComplete: (results: any) => void;
  onBack: () => void;
  classExerciseSettings?: any;
}

export const TakeExercise: React.FC<TakeExerciseProps> = ({
  exercise,
  onComplete,
  onBack,
  classExerciseSettings,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (answer: any) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < exercise.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const results = {
      exerciseId: exercise.id,
      answers,
      timeElapsed,
      completedAt: new Date().toISOString(),
      score: calculateScore(),
    };

    setIsCompleted(true);
    setShowResults(true);
    onComplete(results);
  };

  const calculateScore = () => {
    const correctAnswers = answers.filter((ans, i) => {
      const question = exercise.questions[i];
      if (question.type === 'connecting-lines' || question.type === 'sequencing') {
        return JSON.stringify(ans) === JSON.stringify(question.answer);
      }
      return ans === question.answer;
    }).length;
    return Math.round((correctAnswers / exercise.questions.length) * 100);
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setTimeElapsed(0);
    setIsCompleted(false);
    setShowResults(false);
  };

  if (showResults) {
    return (
      <ExerciseResults
        exercise={exercise}
        userAnswers={answers}
        timeElapsed={timeElapsed}
        onRestart={handleRestart}
        onBack={onBack}
        minimumPassingGrade={classExerciseSettings?.minimum_passing_grade}
      />
    );
  }

  const currentQ = exercise.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / exercise.questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exercises
          </Button>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {formatTime(timeElapsed)}
            </div>
            <div>
              Question {currentQuestion + 1} of {exercise.questions.length}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{exercise.title}</h1>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <QuestionRenderer
          key={currentQuestion}
          question={currentQ}
          userAnswer={answers[currentQuestion]}
          onAnswer={handleAnswer}
          isSubmitted={isCompleted}
        />
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="text-sm text-gray-600">
            {answers[currentQuestion] !== undefined ? (
              <span className="text-green-600">Answered</span>
            ) : (
              <span className="text-orange-600">Not answered</span>
            )}
          </div>

          <Button
            onClick={handleNext}
            disabled={answers[currentQuestion] === undefined}
          >
            {currentQuestion === exercise.questions.length - 1 ? 'Submit' : 'Next'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
