import { supabase } from '../services/supabaseClient';

const transformToOptions = (data: string[] | undefined) => {
  if (!data) return [];
  return data.map(item => ({ value: item, label: item }));
};

const STATIC_SUBJECTS = [
  'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPA', 'IPS',
  'Fisika', 'Kimia', 'Biologi', 'Sejarah', 'Geografi', 'Ekonomi',
  'Sosiologi', 'PKn', 'Pendidikan Agama', 'Seni Budaya', 'PJOK',
  'Informatika', 'Prakarya', 'Bahasa Jawa', 'Bahasa Sunda', 'Bahasa Arab',
];

const STATIC_GRADES = [
  'Grade 1 (SD)', 'Grade 2 (SD)', 'Grade 3 (SD)', 'Grade 4 (SD)', 'Grade 5 (SD)', 'Grade 6 (SD)',
  'Grade 7 (SMP)', 'Grade 8 (SMP)', 'Grade 9 (SMP)',
  'Grade 10 (SMA)', 'Grade 11 (SMA)', 'Grade 12 (SMA)',
];

const STATIC_DIFFICULTIES = ['easy', 'medium', 'hard'];

export const fetchFilterOptions = async () => {
  try {
    const { data } = await supabase
      .from('exercises')
      .select('subject, grade, difficulty, curriculum_type');

    const dbSubjects = [...new Set((data || []).map((r: any) => r.subject).filter(Boolean))] as string[];
    const dbGrades = [...new Set((data || []).map((r: any) => r.grade).filter(Boolean))] as string[];
    const curriculumTypes = [...new Set((data || []).map((r: any) => r.curriculum_type).filter(Boolean))] as string[];

    const mergedSubjects = [...new Set([...STATIC_SUBJECTS, ...dbSubjects])];
    const mergedGrades = [...new Set([...STATIC_GRADES, ...dbGrades])];

    return {
      subjects: transformToOptions(mergedSubjects),
      grades: transformToOptions(mergedGrades),
      assessmentTypes: transformToOptions(['Formative', 'Summative', 'Diagnostic']),
      curriculumTypes: curriculumTypes.length > 0
        ? transformToOptions(curriculumTypes)
        : transformToOptions(['Kurikulum Merdeka Belajar', 'Kurikulum Deep Learning', 'Cambridge International Curriculum (CAIE)', 'International Baccalaureate (IB)']),
      semesters: transformToOptions(['Semester 1', 'Semester 2']),
      difficultyLevels: transformToOptions(STATIC_DIFFICULTIES),
    };
  } catch (error) {
    return {
      subjects: transformToOptions(STATIC_SUBJECTS),
      grades: transformToOptions(STATIC_GRADES),
      assessmentTypes: transformToOptions(['Formative', 'Summative', 'Diagnostic']),
      curriculumTypes: transformToOptions(['Kurikulum Merdeka Belajar', 'Kurikulum Deep Learning', 'Cambridge International Curriculum (CAIE)', 'International Baccalaureate (IB)']),
      semesters: transformToOptions(['Semester 1', 'Semester 2']),
      difficultyLevels: transformToOptions(STATIC_DIFFICULTIES),
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