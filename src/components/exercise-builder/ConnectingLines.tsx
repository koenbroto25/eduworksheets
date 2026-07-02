import React, { useState, useRef, useEffect } from 'react';

interface ConnectingLinesProps {
  leftItems: string[];
  rightItems: string[];
  userAnswer: { [key: number]: number[] };
  onAnswer: (answer: { [key: number]: number[] }) => void;
  isSubmitted: boolean;
  correctAnswer: { [key: number]: number[] };
}

export const ConnectingLines: React.FC<ConnectingLinesProps> = ({ leftItems, rightItems, userAnswer, onAnswer, isSubmitted, correctAnswer }) => {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<{ start: DOMRect; end: DOMRect; isCorrect: boolean }[]>([]);

  useEffect(() => {
    const updateLines = () => {
      if (!containerRef.current) return;

      const newLines: { start: DOMRect; end: DOMRect; isCorrect: boolean }[] = [];
      Object.entries(userAnswer).forEach(([leftIndex, rightIndices]) => {
        rightIndices.forEach(rightIndex => {
          const leftEl = containerRef.current?.querySelector(`[data-left-index="${leftIndex}"]`);
          const rightEl = containerRef.current?.querySelector(`[data-right-index="${rightIndex}"]`);

          if (leftEl && rightEl) {
            const isCorrect = correctAnswer[parseInt(leftIndex)]?.includes(rightIndex);
            newLines.push({ start: leftEl.getBoundingClientRect(), end: rightEl.getBoundingClientRect(), isCorrect });
          }
        });
      });
      
      setLines(newLines);
    };

    updateLines();
    window.addEventListener('resize', updateLines);
    return () => window.removeEventListener('resize', updateLines);
  }, [userAnswer, correctAnswer]);

  const handleLeftClick = (index: number) => {
    if (isSubmitted) return;
    setSelectedLeft(index);
  };

  const handleRightClick = (index: number) => {
    if (isSubmitted || selectedLeft === null) return;

    const newAnswer = { ...userAnswer };
    const currentConnections = newAnswer[selectedLeft] || [];

    if (currentConnections.includes(index)) {
      // Remove the connection if it already exists
      newAnswer[selectedLeft] = currentConnections.filter(i => i !== index);
    } else {
      // Add the new connection
      newAnswer[selectedLeft] = [...currentConnections, index];
    }

    onAnswer(newAnswer);
    setSelectedLeft(null);
  };

  const getLineColor = (isCorrect: boolean) => {
    if (!isSubmitted) return 'stroke-current text-gray-400';
    return isCorrect ? 'stroke-current text-green-500' : 'stroke-current text-red-500';
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex justify-between">
        <div className="w-1/3 space-y-2">
          {leftItems.map((item, index) => (
            <div
              key={index}
              data-left-index={index}
              onClick={() => handleLeftClick(index)}
              className={`p-2 border rounded cursor-pointer ${selectedLeft === index ? 'bg-blue-200' : 'bg-white'}`}
            >
              {item}
            </div>
          ))}
        </div>
        <div className="w-1/3 space-y-2">
          {rightItems.map((item, index) => (
            <div
              key={index}
              data-right-index={index}
              onClick={() => handleRightClick(index)}
              className="p-2 border rounded cursor-pointer bg-white"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {lines.map(({ start, end, isCorrect }, index) => {
          const containerRect = containerRef.current?.getBoundingClientRect();
          if (!containerRect) return null;

          const startX = start.right - containerRect.left;
          const startY = start.top + start.height / 2 - containerRect.top;
          const endX = end.left - containerRect.left;
          const endY = end.top + end.height / 2 - containerRect.top;

          return (
            <line
              key={index}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              className={getLineColor(isCorrect)}
              strokeWidth="2"
            />
          );
        })}
      </svg>
    </div>
  );
};
