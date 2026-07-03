import { supabase } from '../services/supabaseClient';

const transformToOptions = (data: string[] | undefined) => {
  if (!data) return [];
  return data.map(item => ({ value: item, label: item }));
};

export const fetchFilterOptions = async () => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('subject, grade, difficulty, curriculum_type');
    if (error) throw error;

    const subjects = [...new Set((data || []).map((r: any) => r.subject).filter(Boolean))];
    const grades = [...new Set((data || []).map((r: any) => r.grade).filter(Boolean))];
    const difficulties = [...new Set((data || []).map((r: any) => r.difficulty).filter(Boolean))];
    const curriculumTypes = [...new Set((data || []).map((r: any) => r.curriculum_type).filter(Boolean))];

    return {
      subjects: transformToOptions(subjects as string[]),
      grades: transformToOptions(grades as string[]),
      assessmentTypes: [],
      curriculumTypes: transformToOptions(curriculumTypes as string[]),
      semesters: [],
      difficultyLevels: transformToOptions(difficulties as string[]),
    };
  } catch (error) {
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