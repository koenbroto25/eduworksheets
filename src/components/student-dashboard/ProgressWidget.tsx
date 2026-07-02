import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentAssignment } from '../../types';

interface Grade extends Partial<StudentAssignment> {
  score: number;
}

interface ProgressWidgetProps {
  recentGrades: Grade[];
}

const ProgressWidget: React.FC<ProgressWidgetProps> = ({ recentGrades = [] }) => {
  const navigate = useNavigate();

  // Simplified: The button will always navigate to the central report page.
  // That page will handle the logic for selecting a class if needed.
  const handleViewReport = () => {
    navigate('/student/report');
  };

  // The button is enabled as long as there are grades.
  // The report page will inform the user if they have no classes.
  const canViewReport = recentGrades.length > 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Nilai Terbaru</h2>
      <div className="space-y-3">
        {recentGrades.length > 0 ? (
          recentGrades.map((grade) => (
            <div key={grade.id} className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{grade.exercise?.title || 'Latihan Tanpa Judul'}</p>
                <p className="text-sm text-gray-500">{grade.exercise?.subject || 'N/A'}</p>
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
      <button
        onClick={handleViewReport}
        disabled={!canViewReport}
        className="mt-6 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Lihat Rapor Lengkap
      </button>
    </div>
  );
};

export default ProgressWidget;
