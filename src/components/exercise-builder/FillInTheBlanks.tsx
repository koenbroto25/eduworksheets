import React from 'react';
import { Question } from '../../types';

interface FillInTheBlanksProps {
  question: Question;
}

const FillInTheBlanks: React.FC<FillInTheBlanksProps> = ({ question }) => {
  const { textWithBlanks, wordBank } = question;

  const renderTextWithBlanks = () => {
    if (!textWithBlanks) return null;
    const parts = textWithBlanks.split('___');
    return (
      <p>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <span className="inline-block w-24 h-8 border-b-2 border-gray-400 mx-2"></span>
            )}
          </React.Fragment>
        ))}
      </p>
    );
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">{question.question}</h3>
      <div className="my-4">{renderTextWithBlanks()}</div>
      <div className="flex flex-wrap gap-2">
        {wordBank?.map((word, index) => (
          <div key={index} className="bg-gray-200 px-3 py-1 rounded-full">
            {word}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FillInTheBlanks;
