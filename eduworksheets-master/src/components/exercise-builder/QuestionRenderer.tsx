import React from 'react';
import { Question } from '../../types';
import { ConnectingLines } from './ConnectingLines';
import StudentSequencing from '../student-exercise/StudentSequencing';
import FillInTheBlanks from './FillInTheBlanks';

interface QuestionRendererProps {
  question: Question;
  userAnswer: any;
  onAnswer: (answer: any) => void;
  isSubmitted: boolean;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({ question, userAnswer, onAnswer, isSubmitted }) => {
  const { type, question: questionText, options, answer, leftItems, rightItems } = question;

  const renderOptions = () => {
    if (!options) return null;

    return (options as string[]).map((option: string, index: number) => {
      const isCorrect = index === answer;
      const isSelected = userAnswer === index;
      let optionStyle = '';

      if (isSubmitted) {
        if (isCorrect) {
          optionStyle = 'bg-green-200';
        } else if (isSelected) {
          optionStyle = 'bg-red-200';
        }
      }

      return (
        <div key={index} className={`p-2 rounded ${optionStyle}`}>
          <label className="flex items-center">
            <input
              type="radio"
              name={questionText}
              value={index}
              checked={isSelected}
              onChange={() => onAnswer(index)}
              disabled={isSubmitted}
              className="mr-2"
            />
            {option}
          </label>
        </div>
      );
    });
  };

  const renderShortAnswer = () => {
    return (
      <div>
        <input
          type="text"
          value={userAnswer || ''}
          onChange={(e) => onAnswer(e.target.value)}
          disabled={isSubmitted}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isSubmitted && (
          <div className={`mt-2 text-sm ${userAnswer === answer ? 'text-green-600' : 'text-red-600'}`}>
            {userAnswer === answer ? 'Correct!' : `The correct answer is: ${answer}`}
          </div>
        )}
      </div>
    );
  };

  const renderConnectingLines = () => {
    if (!leftItems || !rightItems) return null;
    return (
      <ConnectingLines
        leftItems={leftItems}
        rightItems={rightItems}
        userAnswer={userAnswer || {}}
        onAnswer={onAnswer}
        isSubmitted={isSubmitted}
        correctAnswer={answer}
      />
    );
  };

  const renderPlaceholder = (type: string) => {
    return <div className="text-gray-500">Question type "{type}" is not yet implemented.</div>;
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">{questionText}</h3>
      <div className="space-y-2">
        {type === 'multiple-choice' && renderOptions()}
        {type === 'short-answer' && renderShortAnswer()}
        {type === 'connecting-lines' && renderConnectingLines()}
        {type === 'sequencing' && (
          <StudentSequencing
            question={question}
            userAnswer={userAnswer}
            onAnswer={onAnswer}
            isSubmitted={isSubmitted}
          />
        )}
        {type === 'fill-in-the-blanks' && <FillInTheBlanks question={question} />}
      </div>
      {isSubmitted && question.explanation && (
        <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-800">
          <p className="font-bold">Explanation:</p>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
};
