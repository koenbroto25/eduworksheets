import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { Check, X } from 'lucide-react';

interface StudentSequencingProps {
  question: Question;
  userAnswer: string[] | undefined;
  onAnswer: (answer: string[]) => void;
  isSubmitted: boolean;
}

const StudentSequencing: React.FC<StudentSequencingProps> = ({ question, userAnswer, onAnswer, isSubmitted }) => {
  const [items, setItems] = useState(userAnswer || question.items || []);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Initialize answer in parent if not already set
    if (!userAnswer && question.items) {
      onAnswer(question.items);
    }
  }, []);

  useEffect(() => {
    // Sync local state with parent state
    setItems(userAnswer || question.items || []);
  }, [userAnswer, question.items]);

  const handleItemClick = (index: number) => {
    if (isSubmitted) return;

    if (selectedIndex === null) {
      // First item selected
      setSelectedIndex(index);
    } else {
      // Second item selected, swap them
      const newItems = [...items];
      const firstItem = newItems[selectedIndex];
      newItems[selectedIndex] = newItems[index];
      newItems[index] = firstItem;

      setItems(newItems);
      onAnswer(newItems);
      setSelectedIndex(null); // Reset selection
    }
  };

  const getStyle = (index: number) => {
    const isCorrect = question.answer[index] === items[index];

    if (isSubmitted) {
      return isCorrect ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500';
    }
    if (selectedIndex === index) {
      return 'bg-blue-200 border-blue-500';
    }
    return 'bg-white hover:bg-gray-50';
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const isCorrect = question.answer[index] === item;
        return (
          <button
            key={index}
            onClick={() => handleItemClick(index)}
            disabled={isSubmitted}
            className={`w-full flex items-center justify-between p-3 border rounded-lg text-left transition-all ${getStyle(index)}`}
          >
            <span>{item}</span>
            {isSubmitted && (
              isCorrect ? <Check className="text-green-600" /> : <X className="text-red-600" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StudentSequencing;
