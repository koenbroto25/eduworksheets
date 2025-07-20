import React, { useState } from 'react';
import { QuestionRenderer } from './QuestionRenderer';
import { Button } from '../common/Button';
import { Question } from '../../types';

interface ExercisePreviewProps {
  questions: Question[];
}

export const ExercisePreview: React.FC<ExercisePreviewProps> = ({ questions }) => {
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleAnswer = (questionIndex: number, answer: any) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach((q, i) => {
      // For connecting lines, we need to deep compare the objects
      if (q.type === 'connecting-lines') {
        if (JSON.stringify(userAnswers[i]) === JSON.stringify(q.answer)) {
          correctCount++;
        }
      } else if (userAnswers[i] === q.answer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setIsSubmitted(true);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No questions to preview</p>
        <p className="text-gray-400">Add questions to see a preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Exercise Preview</h3>
      </div>
      
      <div className="space-y-4">
        {questions.map((q, i) => (
          <QuestionRenderer
            key={i}
            question={q}
            userAnswer={userAnswers[i]}
            onAnswer={(answer) => handleAnswer(i, answer)}
            isSubmitted={isSubmitted}
          />
        ))}
      </div>

      {!isSubmitted && (
        <Button onClick={handleSubmit} disabled={userAnswers.length !== questions.length}>
          Submit
        </Button>
      )}

      {isSubmitted && score !== null && (
        <div className={`mt-6 p-6 rounded-lg ${score === questions.length ? 'bg-green-50' : 'bg-red-50'}`}>
          <h4 className={`text-xl font-bold ${score === questions.length ? 'text-green-900' : 'text-red-900'} mb-2`}>
            Your Score: {score} / {questions.length}
          </h4>
        </div>
      )}
    </div>
  );
};
