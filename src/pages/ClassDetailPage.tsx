import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../hooks/useAuth';
import { Class, User, FlatClassExercise, FullClassExercise, Exercise } from '../types';
import { ExerciseCard } from '../components/public-library/ExerciseCard';
import { Button } from '../components/common/Button';
import ClassExerciseSettingsModal from '../components/classroom/ClassExerciseSettingsModal';
import ClassGradesGrid from '../components/classroom/ClassGradesGrid';

type Tab = 'exercises' | 'students' | 'grades';

const ClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const { supabase, user } = useAuth();
  const navigate = useNavigate();
  const [classDetails, setClassDetails] = useState<Class | null>(null);
  const [teacher, setTeacher] = useState<User | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [exercises, setExercises] = useState<FlatClassExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<FlatClassExercise | FullClassExercise | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('exercises');

  const fetchClassData = async () => {
    if (!classId || !supabase) return;

    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Fetch basic class details using the robust, simple RPC
      const { data: rpcData, error: classError } = await supabaseService.getClassDetails(supabase, classId);
      if (classError) throw classError;
      
      // The RPC returns an array, so we take the first element.
      const classData = rpcData && rpcData.length > 0 ? rpcData[0] : null;
      if (!classData) throw new Error('Class not found.');

      setClassDetails(classData);

      // Step 2: Once we have the teacher_id, fetch the teacher's profile
      if (classData.teacher_id) {
        const { data: teacherData, error: teacherError } = await supabaseService.getUserProfile(supabase, classData.teacher_id);
        if (teacherError) console.error("Could not fetch teacher details:", teacherError.message);
        setTeacher(teacherData || null);
      }

      // Step 3: Students are now included in the classData object from the RPC
      setStudents(classData.students || []);

      // Step 4: Fetch exercises separately
      const { data: exercisesData, error: exercisesError } = await supabaseService.getClassExercises(supabase, classId);
      if (exercisesError) throw exercisesError;
      setExercises(exercisesData || []);

    } catch (err: any) {
      setError(err.message || 'Failed to fetch class data');
      console.error('Error fetching class data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClassData();
  }, [classId, supabase]);

  const handleViewExercise = (exercise: Exercise | FlatClassExercise) => {
    if (!classId) return;
    
    // The exercise object from class details is a FlatClassExercise, which has exercise_id
    // A regular exercise from another context might just have an id.
    const exerciseId = 'exercise_id' in exercise ? exercise.exercise_id : exercise.id;

    // Navigate to the new teacher-specific take exercise page
    navigate(`/class/${classId}/take-exercise/${exerciseId}`);
  };

  const handleOpenSettings = async (exercise: FlatClassExercise) => {
    if (!supabase || !classId) return;
    
    setIsFetchingDetails(true);
    setSelectedExercise(exercise); // Set the flat exercise initially for context
    setIsSettingsModalOpen(true);

    try {
      const { data, error } = await supabaseService.getClassExerciseDetailsForTeacher(supabase, classId, exercise.exercise_id);
      if (error) {
        throw error;
      }
      // Once full data is fetched, update the selected exercise state
      setSelectedExercise(data as FullClassExercise);
    } catch (err: any) {
      console.error("Failed to fetch full exercise details:", err);
      alert(`Error: ${err.message || 'Could not load exercise settings.'}`);
      setIsSettingsModalOpen(false); // Close modal on error
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleCloseSettings = () => {
    setIsSettingsModalOpen(false);
    setSelectedExercise(null);
  };

  const handleSaveSettings = async (settings: Partial<FullClassExercise>) => {
    if (!supabase || !selectedExercise) return;

    // The ID for the class_exercises table is on the selectedExercise object
    // Note: The RPC returns it as `class_exercise_id`, but the FlatClassExercise type has it as `id`.
    // Let's ensure we can handle both cases if needed, but `selectedExercise.id` should be correct.
    const classExerciseId = (selectedExercise as any).class_exercise_id || selectedExercise.id;

    const { error } = await supabaseService.updateClassExerciseSettings(
      supabase,
      classExerciseId,
      settings
    );

    if (error) {
      alert(`Failed to save settings: ${error.message}`);
    } else {
      alert('Settings saved successfully!');
      handleCloseSettings();
      fetchClassData(); // Refresh data to show changes
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!supabase || !classId) return;
    const confirmation = window.confirm('Are you sure you want to unassign this exercise?');
    if (confirmation) {
      const { error } = await supabaseService.unassignExerciseFromClass(supabase, classId, exerciseId);
      if (error) {
        alert('Failed to unassign exercise.');
      } else {
        alert('Exercise unassigned successfully.');
        fetchClassData(); // Refresh data
      }
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  if (!classDetails) {
    return <div className="text-center p-8">Class not found.</div>;
  }

  const handleCopyCode = () => {
    if (classDetails?.class_code) {
      navigator.clipboard.writeText(classDetails.class_code);
      alert('Class code copied to clipboard!');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className="text-3xl font-bold">{classDetails.name}</h1>
          {teacher && <p className="text-lg text-gray-700">By {teacher.name}</p>}
          <p className="text-gray-600 mt-2">{classDetails.description}</p>
        </div>
        {classDetails.class_code && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg bg-gray-100 p-2 rounded">
              {classDetails.class_code}
            </span>
            <Button onClick={handleCopyCode} variant="outline">Copy Code</Button>
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('exercises')}
              className={`${
                activeTab === 'exercises'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Latihan Soal
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`${
                activeTab === 'students'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Siswa ({students.length})
            </button>
            {user?.id === classDetails.teacher_id && (
              <button
                onClick={() => setActiveTab('grades')}
                className={`${
                  activeTab === 'grades'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Laporan Nilai
              </button>
            )}
          </nav>
        </div>
      </div>

      <div className="mt-8">
        {activeTab === 'exercises' && (
          <div className="space-y-4">
            {exercises.length > 0 ? (
              exercises.map(classExercise => (
                <ExerciseCard
                  key={classExercise.id}
                  exercise={classExercise}
                  onView={handleViewExercise}
                  onDeleteExercise={() => handleDeleteExercise(classExercise.exercise_id)}
                  isCreator={user?.id === classDetails.teacher_id}
                  context="classDetail"
                  onOpenSettings={() => handleOpenSettings(classExercise)}
                />
              ))
            ) : (
              <p className="text-gray-500">Belum ada latihan soal yang ditugaskan di kelas ini.</p>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white p-4 rounded-lg shadow">
            <ul className="space-y-2">
              {students.map(student => (
                <li key={student.id} className="text-gray-700">{student.name}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'grades' && classId && (
          <ClassGradesGrid classId={classId} />
        )}
      </div>
      {isSettingsModalOpen && (
        <ClassExerciseSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={handleCloseSettings}
          onSave={handleSaveSettings}
          exerciseData={selectedExercise as FullClassExercise}
          isLoading={isFetchingDetails}
        />
      )}
    </div>
  );
};

export default ClassDetailPage;
