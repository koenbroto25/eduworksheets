import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../services/supabaseService';
import { useAuth } from '../../contexts/AuthContext';
import { FilterDropdown } from '../common/FilterDropdown';
import { Button } from '../common/Button';
import { fetchFilterOptions, sortOptions } from '../../data/filterOptions';
import { EditExerciseInfoModal } from './EditExerciseInfoModal';
import { AssignToClassModal } from '../classroom/AssignToClassModal';
import { supabase } from '../../services/supabaseClient';

const MyExercises = () => {
  const { user, supabase: authSupabase } = useAuth();
  const [exercises, setExercises] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [filters, setFilters] = useState({
    grade: 'all',
    subject: 'all',
    assessment_type: 'all',
    semester: 'all',
    curriculum_type: 'all',
    sort: 'newest',
  });
  const [subjectOptions, setSubjectOptions] = useState<{ value: string; label: string }[]>([]);
  const [gradeOptions, setGradeOptions] = useState<{ value: string; label: string }[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<{ value: string; label: string }[]>([]);
  const [assessmentTypeOptions, setAssessmentTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [curriculumTypeOptions, setCurriculumTypeOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const loadOptions = async () => {
      const options = await fetchFilterOptions();
      setSubjectOptions(options.subjects);
      setGradeOptions(options.grades);
      setSemesterOptions(options.semesters);
      setAssessmentTypeOptions(options.assessmentTypes);
      setCurriculumTypeOptions(options.curriculumTypes);
    };
    loadOptions();
  }, []);

  useEffect(() => {
    const fetchExercises = async () => {
      if (user && authSupabase) {
        const { data, error } = await supabaseService.getUserExercises(authSupabase, user.id, filters);
        if (data) {
          setExercises(data);
        } else if (error) {
          console.error("Error fetching filtered exercises:", error);
        }
      }
    };
    fetchExercises();
  }, [user, filters]);

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const handleEdit = (exercise: any) => {
    setSelectedExercise(exercise);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedExercise(null);
  };

  const handleAssign = (exercise: any) => {
    setSelectedExercise(exercise);
    setIsAssignModalOpen(true);
  };

  const handleSaveModal = (updatedExercise: any) => {
    setExercises(exercises.map(e => e.id === updatedExercise.id ? updatedExercise : e));
  };

  const handleDelete = async (exerciseId: string) => {
    if (window.confirm('Are you sure you want to delete this exercise? This action cannot be undone.')) {
      if (!supabase) return;
      const { error } = await supabaseService.deleteExercise(supabase, exerciseId);
      if (error) {
        alert('Error deleting exercise: ' + error.message);
      } else {
        setExercises(exercises.filter(e => e.id !== exerciseId));
        alert('Exercise deleted successfully.');
      }
    }
  };

  const handleVisibilityChange = async (exerciseId: string, currentStatus: boolean) => {
    if (!supabase) return;
    const { error } = await supabaseService.updateExerciseVisibility(supabase, exerciseId, !currentStatus);
    if (error) {
      alert('Error updating visibility: ' + error.message);
    } else {
      setExercises(exercises.map(e => e.id === exerciseId ? { ...e, is_public: !currentStatus } : e));
    }
  };

  const handleGradeChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      grade: value,
      subject: 'all'
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">My Created Exercises</h2>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
        <FilterDropdown
          label="Grade"
          options={gradeOptions}
          value={filters.grade}
          onChange={handleGradeChange}
        />
        <FilterDropdown
          label="Subject"
          options={subjectOptions}
          value={filters.subject}
          onChange={(value) => handleFilterChange('subject', value)}
          // showAllOption is true by default, so it will add "All Subject"
        />
        <FilterDropdown
          label="Assessment Type"
          options={assessmentTypeOptions}
          value={filters.assessment_type}
          onChange={(value) => handleFilterChange('assessment_type', value)}
        />
        <FilterDropdown
          label="Semester"
          options={semesterOptions}
          value={filters.semester}
          onChange={(value) => handleFilterChange('semester', value)}
        />
        <FilterDropdown
          label="Curriculum"
          options={curriculumTypeOptions}
          value={filters.curriculum_type}
          onChange={(value) => handleFilterChange('curriculum_type', value)}
        />
        <FilterDropdown
          label="Sort By"
          options={sortOptions}
          value={filters.sort}
          onChange={(value) => handleFilterChange('sort', value)}
        />
      </div>
      <div className="space-y-4">
        {exercises.length > 0 ? (
          exercises.map((exercise) => (
            <div key={exercise.id} className="border p-4 rounded-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{exercise.title}</h3>
                  <p className="text-sm text-gray-500">
                    {exercise.subject} - <span>Grade {exercise.grade}</span> - <span>Semester {exercise.semester}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {exercise.curriculum_type} - {exercise.assessment_type}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{exercise.is_public ? 'Public' : 'Private'}</span>
                  {/* Placeholder for ToggleSwitch */}
                  <button onClick={() => handleVisibilityChange(exercise.id, exercise.is_public)} className={`w-12 h-6 rounded-full flex items-center transition-colors ${exercise.is_public ? 'bg-blue-500' : 'bg-gray-300'}`}>
                    <span className={`inline-block w-5 h-5 bg-white rounded-full transform transition-transform ${exercise.is_public ? 'translate-x-6' : 'translate-x-1'}`}/>
                  </button>
                </div>
              </div>
              <div className="mt-4 flex justify-end items-center space-x-2">
                <Button size="sm" variant="primary" onClick={() => handleAssign(exercise)}>+ Gunakan di Kelas Saya</Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(exercise)}>Edit</Button>
                <Button size="sm">Share</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(exercise.id)}>Delete</Button>
              </div>
            </div>
          ))
        ) : (
          <p>You haven't created any exercises yet.</p>
        )}
      </div>
      {selectedExercise && isModalOpen && (
        <EditExerciseInfoModal
          exercise={selectedExercise}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveModal}
        />
      )}
      {selectedExercise && isAssignModalOpen && (
        <AssignToClassModal
          exercise={selectedExercise}
          onClose={() => setIsAssignModalOpen(false)}
          onAssign={async (selectedClassIds) => {
            if (!user) {
              alert('You must be logged in to assign exercises.');
              return;
            }
            const assignments = selectedClassIds.map((classId) => {
              const dueDate = new Date();
              dueDate.setDate(dueDate.getDate() + 7);
              return {
                class_id: classId,
                exercise_id: selectedExercise.id,
                due_date: dueDate.toISOString(),
              };
            });
            const { error } = await supabase.from('class_exercises').insert(assignments);
            if (error) {
              console.error('Error assigning exercise:', error);
              alert(`Gagal menugaskan latihan: ${error.message}`);
            } else {
              alert('Latihan berhasil ditugaskan!');
              setIsAssignModalOpen(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default MyExercises;
