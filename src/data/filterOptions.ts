import { supabase } from '../services/supabaseClient';

const transformToOptions = (data: string[] | undefined) => {
  if (!data) return [];
  return data.map(item => ({ value: item, label: item }));
};

export const fetchFilterOptions = async () => {
  const { data, error } = await supabase.functions.invoke('get-all-options');

  if (error) {
    console.error('Error fetching filter options:', error);
    return {
      subjects: [],
      grades: [],
      assessmentTypes: [],
      curriculumTypes: [],
      semesters: [],
      difficultyLevels: [],
    };
  }

  return {
    subjects: transformToOptions(data.subjects),
    grades: transformToOptions(data.grades),
    assessmentTypes: transformToOptions(data.assessmentTypes),
    curriculumTypes: transformToOptions(data.curriculumTypes),
    semesters: transformToOptions(data.semesters),
    difficultyLevels: transformToOptions(data.difficultyLevels),
  };
};

export const questionTypeOptions = [
  { value: 'Multiple Choice', label: 'Multiple Choice' },
  { value: 'Short Answer', label: 'Short Answer' },
  { value: 'Connecting Line', label: 'Connecting Line' },
  { value: 'Sequencing', label: 'Sequencing' },
];

export const sortOptions = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'oldest', label: 'Terlama' }
];
