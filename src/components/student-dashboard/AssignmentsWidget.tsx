import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentAssignment } from '../../types';

interface AssignmentsWidgetProps {
  assignments: StudentAssignment[];
}

type Status = 'Belum Dikerjakan' | 'Sedang Dikerjakan' | 'Selesai';
type Source = 'Semua' | 'Guru' | 'Orang Tua' | 'Mandiri';

const AssignmentsWidget: React.FC<AssignmentsWidgetProps> = ({ assignments = [] }) => {
  const [filter, setFilter] = useState<Source>('Semua');
  const navigate = useNavigate();

  const handleNavigation = (task: StudentAssignment) => {
    if (task.status === 'Selesai') {
      // Navigate to a results page, which might need the assignment ID
      navigate(`/student/results/${task.id}`);
    } else {
      // Navigate to the exercise page using the exercise's UUID
      navigate(`/take-exercise/${task.exercise.id}`);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'Belum Dikerjakan':
        return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">{status}</span>;
      case 'Sedang Dikerjakan':
        return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">{status}</span>;
      case 'Selesai':
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">{status}</span>;
    }
  };

  const filteredAssignments = (assignments || []).filter(
    (assignment) => filter === 'Semua' || assignment.source.name === filter
  );

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-bold">Semua Tugas Aktif</h2>
        <div className="flex flex-wrap gap-2">
          {(['Semua', 'Guru', 'Orang Tua', 'Mandiri'] as Source[]).map((source) => (
            <button
              key={source}
              onClick={() => setFilter(source)}
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                filter === source ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {source}
            </button>
          ))}
        </div>
      </div>
      <ul className="space-y-3">
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((task) => (
            <li key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-bold text-gray-900">{task.exercise.title}</p>
                <p className="text-sm text-gray-600">
                  {task.exercise.subject} - Tenggat: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {getStatusChip(task.status as Status)}
                <button
                  onClick={() => handleNavigation(task)}
                  className="text-blue-500 hover:underline"
                >
                  {task.status === 'Selesai' ? 'Cek hasil latihan' : 'Lanjutkan'}
                </button>
              </div>
            </li>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">Tidak ada tugas dengan filter ini.</p>
        )}
      </ul>
    </div>
  );
};

export default AssignmentsWidget;
