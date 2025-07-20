import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Exercise } from '../../types';

interface AssignedExercise extends Exercise {
  assigned_at: string;
  completed_at?: string;
  score?: number;
}

interface AssignedExercisesProps {
  childId: string;
}

export const AssignedExercises: React.FC<AssignedExercisesProps> = ({ childId }) => {
  const [assignments, setAssignments] = useState<AssignedExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('parent_assignments')
        .select(`
          *,
          exercises (*)
        `)
        .eq('child_id', childId)
        .order('assigned_at', { ascending: false });

      if (error) {
        console.error('Error fetching assignments:', error);
      } else {
        const formattedAssignments = data.map((item: any) => ({
          ...item.exercises,
          assigned_at: item.assigned_at,
          completed_at: item.completed_at,
          score: item.score,
        }));
        setAssignments(formattedAssignments);
      }
      setIsLoading(false);
    };

    fetchAssignments();
  }, [childId]);

  if (isLoading) {
    return <p className="text-sm text-gray-500">Memuat latihan yang diberikan...</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      <h3 className="text-lg font-semibold text-gray-700">Latihan yang Diberikan</h3>
      {assignments.length === 0 ? (
        <p className="text-sm text-gray-500">Belum ada latihan yang diberikan.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {assignments.map(ex => (
            <li key={ex.id} className="py-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">{ex.title}</p>
                <p className="text-xs text-gray-500">
                  Diberikan pada: {new Date(ex.assigned_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                {ex.completed_at ? (
                  <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                    Selesai (Skor: {ex.score ?? '-'})
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
                    Belum Dikerjakan
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
