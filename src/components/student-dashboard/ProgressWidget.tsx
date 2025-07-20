import React from 'react';

interface Grade {
  id: string | number;
  exercise: {
    title: string;
    subject: string;
  };
  score: number;
}

interface ProgressWidgetProps {
  recentGrades: Grade[];
}

const ProgressWidget: React.FC<ProgressWidgetProps> = ({ recentGrades = [] }) => {
  // For now, we'll just list the recent grades.
  // A more complex implementation could calculate average scores per subject.
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Nilai Terbaru</h2>
      <div className="space-y-3">
        {recentGrades.length > 0 ? (
          recentGrades.map((grade) => (
            <div key={grade.id} className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{grade.exercise.title}</p>
                <p className="text-sm text-gray-500">{grade.exercise.subject}</p>
              </div>
              <span className={`font-bold text-lg ${grade.score >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                {grade.score}
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">Belum ada nilai yang masuk.</p>
        )}
      </div>
      <button className="mt-6 w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
        Lihat Rapor Lengkap
      </button>
    </div>
  );
};

export default ProgressWidget;
