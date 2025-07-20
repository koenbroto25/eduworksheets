import React from 'react';

interface Assignment {
  id: string | number;
  exercise: {
    title: string;
    subject: string;
  };
  due_date: string | null;
  source: {
    name: string;
  };
}

interface TodayFocusWidgetProps {
  assignments: Assignment[];
}

const TodayFocusWidget: React.FC<TodayFocusWidgetProps> = ({ assignments = [] }) => {
  const getIconForSource = (sourceName: string) => {
    if (sourceName === 'Guru') return '🏫';
    if (sourceName === 'Orang Tua') return '🏠';
    return '⭐';
  };

  const today = new Date().setHours(0, 0, 0, 0);
  const todayTasks = (assignments || []).filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date).setHours(0, 0, 0, 0);
    return dueDate === today;
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Fokus Hari Ini</h2>
      <ul className="space-y-4">
        {todayTasks.length > 0 ? (
          todayTasks.map((task) => (
            <li key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <span className="text-2xl mr-4">{getIconForSource(task.source.name)}</span>
                <div>
                  <p className="font-semibold text-gray-800">{task.exercise.title}</p>
                  <p className="text-sm text-gray-500">{task.exercise.subject}</p>
                </div>
              </div>
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Mulai
              </button>
            </li>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">Tidak ada tugas yang harus diselesaikan hari ini. Santai sejenak!</p>
        )}
      </ul>
    </div>
  );
};

export default TodayFocusWidget;
