import React, { useState, useEffect } from 'react';
import { Exercise, Class } from '../../types';
import { Button } from '../common/Button';
import { supabaseService } from '../../services/supabaseService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';

interface AssignToClassModalProps {
  exercise: Exercise;
  onClose: () => void;
  onAssign: (selectedClassIds: string[]) => void;
}

export const AssignToClassModal: React.FC<AssignToClassModalProps> = ({
  exercise,
  onClose,
  onAssign,
}) => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (user && user.role === 'teacher') {
        setLoading(true);
        // Fetch all classes the teacher owns
        const { data: classData, error: classError } = await supabaseService.getUserClasses(supabase, user.id, 'teacher');
        if (classError) {
          console.error('Error fetching classes:', classError);
        } else if (classData) {
          setClasses(classData as Class[]);
        }

        // Fetch classes where the exercise is already assigned
        const exerciseId = 'exercise_id' in exercise ? exercise.exercise_id : exercise.id;
        const { data: assignedData, error: assignedError } = await supabase
          .rpc('get_assigned_class_ids_for_exercise', { p_exercise_id: exerciseId });

        if (assignedError) {
          console.error('Error fetching assigned classes:', assignedError);
        } else if (assignedData) {
          setAssignedClassIds(assignedData.map((item: any) => item.class_id));
        }
      }
      setLoading(false);
    };

    fetchInitialData();
  }, [user, exercise]);

  const handleCheckboxChange = (classId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  const handleAssign = () => {
    onAssign(selectedClasses);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Tugaskan "{exercise.title}" ke kelas</h2>
        {loading ? (
          <p>Memuat kelas...</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {classes.length > 0 ? (
              classes.map((cls) => (
                <div key={cls.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`class-${cls.id}`}
                    checked={selectedClasses.includes(cls.id)}
                    onChange={() => handleCheckboxChange(cls.id)}
                    disabled={assignedClassIds.includes(cls.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
                  />
                  <label
                    htmlFor={`class-${cls.id}`}
                    className={`ml-2 block text-sm ${
                      assignedClassIds.includes(cls.id) ? 'text-gray-500' : 'text-gray-900'
                    }`}
                  >
                    {cls.name}
                    {assignedClassIds.includes(cls.id) && (
                      <span className="text-xs text-gray-400 ml-2">(Sudah ditugaskan)</span>
                    )}
                  </label>
                </div>
              ))
            ) : (
              <p>Anda belum memiliki kelas.</p>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleAssign} disabled={selectedClasses.length === 0 || loading}>
            Tugaskan
          </Button>
        </div>
      </div>
    </div>
  );
};
