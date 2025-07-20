import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PublicExerciseList } from '../components/public-library/PublicExerciseList';
import { supabaseService } from '../services/supabaseService';
import { Exercise } from '../types';
import { FilterDropdown } from '../components/common/FilterDropdown';
import { AssignToChildModal } from '../components/classroom/AssignToChildModal';
import { fetchFilterOptions } from '../data/filterOptions';

export const LibraryPage: React.FC = () => {
  const { user, supabase } = useAuth();
  const location = useLocation();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatorFilter, setCreatorFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [assessmentTypeFilter, setAssessmentTypeFilter] = useState('all');
  const [sort, setSort] = useState('date');
  const [creators, setCreators] = useState<
    { value: string; label: string }[]
  >([]);
  const [filterOptions, setFilterOptions] = useState<{
    grades: { value: string; label: string }[];
    subjects: { value: string; label: string }[];
    difficulties: { value: string; label: string }[];
    assessmentTypes: { value: string; label: string }[];
  }>({
    grades: [],
    subjects: [],
    difficulties: [],
    assessmentTypes: [],
  });
  const [isAssignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const options = await fetchFilterOptions();
        setFilterOptions({
          grades: options.grades,
          subjects: options.subjects,
          difficulties: options.difficultyLevels,
          assessmentTypes: options.assessmentTypes,
        });
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    const fetchPublicExercises = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabaseService.getPublicExercises(
          supabase,
          {
            creator: creatorFilter,
            grade: gradeFilter,
            subject: subjectFilter,
          difficulty: difficultyFilter,
          assessment_type: assessmentTypeFilter,
          sort,
        });

        if (error) {
          throw error;
        }

        const transformedExercises: Exercise[] = (data || []).map(
          (exercise: any) => ({
            ...exercise,
            isPublic: exercise.is_public,
            creatorId: exercise.creator_id,
            creatorName: exercise.creator?.name || 'Unknown',
            createdAt: exercise.created_at,
            curriculum_type: exercise.curriculum_type, // Explicitly map curriculum_type
            // The query returns an object with a count, not the questions themselves
            questions: exercise.questions[0] ? Array(exercise.questions[0].count).fill({}) : [],
            tags: exercise.tags || [],
            views: exercise.views || 0,
            ratings: exercise.ratings || 0,
          })
        );

        setExercises(transformedExercises);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch exercises');
        console.error('Error fetching public exercises:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCreators = async () => {
      const { data, error } = await supabaseService.getCreators(supabase);

      if (error) {
        console.error('Error fetching creators:', error);
        return;
      }

      const creatorOptions = (data || []).map((creator) => ({
        value: creator.id,
        label: creator.name || 'Unknown',
      }));

      setCreators(creatorOptions);
    };

    fetchPublicExercises();
    fetchCreators();
  }, [creatorFilter, gradeFilter, subjectFilter, difficultyFilter, assessmentTypeFilter, sort]);

  const handleUseExercise = (exercise: Exercise) => {
    alert(`Latihan "${exercise.title}" ditambahkan ke kelas Anda!`);
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus latihan ini?')) {
      const { error } = await supabaseService.deleteExercise(supabase, exerciseId);
      if (error) {
        alert('Gagal menghapus latihan.');
        console.error('Error deleting exercise:', error);
      } else {
        setExercises(exercises.filter((ex) => ex.id !== exerciseId));
        alert('Latihan berhasil dihapus.');
      }
    }
  };

  const handleAssignToChild = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = async (childIds: string[]) => {
    if (!selectedExercise || !user) return;

    try {
      const assignments = childIds.map(childId => ({
        parentId: user.id,
        childId: childId,
        exerciseId: selectedExercise.id,
      }));

      // Use Promise.all to send all assignments
      await Promise.all(
        assignments.map(assignment => 
          supabaseService.assignExerciseToChild(supabase, assignment)
        )
      );

      alert('Latihan berhasil ditugaskan.');
    } catch (error) {
      console.error('Failed to assign exercise to child', error);
      alert('Gagal menugaskan latihan.');
    } finally {
      setAssignModalOpen(false);
      setSelectedExercise(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg max-w-md mx-auto">
          <p className="font-medium">Gagal memuat latihan</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Perpustakaan Latihan
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Temukan ribuan latihan pendidikan yang dibuat oleh para guru
          di seluruh dunia. Cari, filter, dan temukan konten yang sempurna untuk
          kelas atau belajar mandiri Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
        <FilterDropdown
          label="Pembuat"
          value={creatorFilter}
          onChange={setCreatorFilter}
          options={creators}
        />
        <FilterDropdown
          label="Kelas"
          value={gradeFilter}
          onChange={setGradeFilter}
          options={filterOptions.grades}
        />
        <FilterDropdown
          label="Mata Pelajaran"
          value={subjectFilter}
          onChange={setSubjectFilter}
          options={filterOptions.subjects}
        />
        <FilterDropdown
          label="Tingkat Kesulitan"
          value={difficultyFilter}
          onChange={setDifficultyFilter}
          options={filterOptions.difficulties}
        />
        <FilterDropdown
          label="Jenis Penilaian"
          value={assessmentTypeFilter}
          onChange={setAssessmentTypeFilter}
          options={filterOptions.assessmentTypes}
        />
      </div>
      <div className="flex justify-between items-center">
        <div>
          <label htmlFor="sort" className="mr-2">
            Urutkan berdasarkan:
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="date">Tanggal</option>
            <option value="views">Dilihat</option>
            <option value="ratings">Peringkat</option>
          </select>
        </div>
      </div>

      <PublicExerciseList
        exercises={exercises}
        onUseExercise={handleUseExercise}
        onDeleteExercise={handleDeleteExercise}
        userId={user?.id}
        onAssignToChild={handleAssignToChild}
      />

      {isAssignModalOpen && selectedExercise && user && (
        <AssignToChildModal
          onClose={() => setAssignModalOpen(false)}
          exercise={selectedExercise}
          onConfirmAssign={handleConfirmAssign}
        />
      )}
    </div>
  );
};
