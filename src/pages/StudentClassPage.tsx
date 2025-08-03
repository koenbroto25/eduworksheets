import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { classService } from '../services/classService';
import { useAuth } from '../contexts/AuthContext';
import { ClassExercise } from '../types';
import ClassMembers from '../components/classroom/ClassMembers';
import ClassAnnouncements from '../components/classroom/ClassAnnouncements';
import { ExerciseList } from '../components/student-exercise/ExerciseList';
import ExerciseSettingsDetailModal from '../components/student-exercise/ExerciseSettingsDetailModal';

type Tab = 'exercises' | 'announcements' | 'members';

const StudentClassPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classDetails, setClassDetails] = useState<any>(null);
  const [classExercises, setClassExercises] = useState<ClassExercise[]>([]);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('exercises');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ClassExercise | null>(null);

  useEffect(() => {
    const fetchClassData = async () => {
      if (!classId || !user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data: classData, error: classError } = await classService.getClassDetails(supabase, classId);
        if (classError) throw classError;
        setClassDetails(classData);

        const { data: exerciseData, error: exerciseError } = await classService.getStudentClassAssignments(supabase, classId);
        if (exerciseError) throw exerciseError;
        
        const exercises = exerciseData?.map((ex: any) => ({
          ...ex,
          // The RPC returns 'exercise_title', but the component might expect a nested object.
          // We ensure compatibility here.
          exercise: {
            id: ex.exercise_id,
            title: ex.exercise_title,
          }
        })) || [];
        
        setClassExercises(exercises);

        const completed = exercises.filter((a: any) => a.status === 'completed' || a.status === 'passed' || a.status === 'failed').map((a: any) => a.exercise_id);
        setCompletedExercises(completed);

      } catch (err: any) {
        setError(err.message || 'Failed to fetch class data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassData();
  }, [classId, user]);

  const handleStartExercise = (classExercise: ClassExercise) => {
    navigate(`/class/${classId}/exercise/${classExercise.exercise_id}/take`);
  };

  const handleViewSettings = (classExercise: ClassExercise) => {
    setSelectedExercise(classExercise);
    setIsSettingsModalOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsModalOpen(false);
    setSelectedExercise(null);
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading class...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  if (!classDetails) {
    return <div className="text-center p-8">Class not found.</div>;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'exercises':
        return (
          <ExerciseList
            classExercises={classExercises}
            onStartExercise={handleStartExercise}
            completedExercises={completedExercises}
            onViewSettings={handleViewSettings}
          />
        );
      case 'announcements':
        return <ClassAnnouncements />;
      case 'members':
        return <ClassMembers />;
      default:
        return null;
    }
  };

  const handleCopyCode = () => {
    if (classDetails?.class_code) {
      navigator.clipboard.writeText(classDetails.class_code);
      alert('Class code copied to clipboard!');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">{classDetails.name}</h1>
          <p className="text-lg text-gray-600">{classDetails.description}</p>
        </div>
        {classDetails.class_code && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg bg-gray-100 p-2 rounded">
              {classDetails.class_code}
            </span>
            <button onClick={handleCopyCode} className="btn btn-sm btn-outline">Copy Code</button>
          </div>
        )}
      </div>

      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('exercises')}
            className={`${
              activeTab === 'exercises'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Latihan
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`${
              activeTab === 'announcements'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Pengumuman
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`${
              activeTab === 'members'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Anggota
          </button>
        </nav>
      </div>

      <div>{renderTabContent()}</div>

      {selectedExercise && (
        <ExerciseSettingsDetailModal
          isOpen={isSettingsModalOpen}
          onClose={handleCloseSettings}
          classExercise={selectedExercise}
        />
      )}
    </div>
  );
};

export default StudentClassPage;
