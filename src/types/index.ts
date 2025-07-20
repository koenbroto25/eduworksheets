export type UserRole = 'teacher' | 'student' | 'parent';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  createdAt: string;
  preferences?: any;
  child_code?: string;
  parent_id?: string;
}

export const curriculumTypes = [
  'Kurikulum Merdeka Belajar',
  'Kurikulum Deep Learning',
  'Cambridge International Curriculum (CAIE)',
  'International Baccalaureate (IB)'
] as const;

export type CurriculumType = typeof curriculumTypes[number];

export interface Exercise {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade: string;
  semester?: string;
  material?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'all';
  minimum_passing_grade?: number;
  assessment_type?: string;
  curriculum_type?: CurriculumType;
  is_public: boolean;
  creator_id: string;
  creatorName: string;
  createdAt: string;
  updatedAt?: string;
  class_id?: string;
  question_types?: string[];
  questions: Question[];
  tags: string[];
  views: number;
  ratings: number;
  viewCount?: number;
  likeCount?: number;
  metadata?: {
    sub_topic?: string;
  };
}

export type QuestionType =
  | 'multiple-choice'
  | 'true-false'
  | 'short-answer'
  | 'connecting-lines'
  | 'sequencing'
  | 'fill-in-the-blanks'
  | 'categorization'
  | 'interactive-diagram'
  | 'code-block';

export interface Question {
  id: string;
  exercise_id: string;
  type: QuestionType;
  question: string;
  options?: any; // Can be string array for MC, or other structures
  answer: any;
  explanation?: string;
  hints?: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'all';
  points?: number;
  order_index: number;
  metadata?: any;
  created_at?: string;
  // For specific question types
  leftItems?: any[];
  rightItems?: any[];
  items?: string[];
  categories?: string[];
  diagram?: {
    imageUrl: string;
    labels: { x: number; y: number; text: string }[];
  };
  code?: {
    language: string;
    snippet: string;
  };
  textWithBlanks?: string;
  wordBank?: string[];
}

export interface Class {
  id: string;
  name: string;
  description: string;
  teacher_id: string;
  class_code: string;
  subject: string | null;
  grade_level: string | null;
  school_year: string | null;
  semester: string | null;
  is_archived: boolean;
  student_count: number;
  students: User[];
}

export type NotificationType =
  | 'class_join'
  | 'assignment_new'
  | 'assignment_completed_passed'
  | 'assignment_completed_failed'
  | 'assignment_graded'
  | 'assignment_overdue'
  | 'announcement';

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface PromptBuilderForm {
  numQuestions: number;
  questionType: string;
  gradeLevel: string;
  customGrade: string;
  subject: string;
  customSubject: string;
  material: string;
  difficulty: string;
  semester: string;
  learningObjectives: string;
  language: string;
  context?: string;
  keywords?: string;
  avoidTopics?: string;
  feedbackType: string;
  emphasis: string;
  chapter?: string;
}

export interface ExerciseAttempt {
  id: string;
  exerciseId: string;
  userId: string;
  answers: any[];
  score: number;
  timeElapsed: number;
  completedAt: string;
  isCompleted: boolean;
}

export interface UserProgress {
  id: string;
  userId: string;
  exerciseId: string;
  classId?: string;
  score: number;
  attempts: number;
  lastAttemptAt: string;
  isCompleted: boolean;
}

export interface ClassStudent {
  id: string;
  classId: string;
  studentId: string;
  joinedAt: string;
}

export type ShowAnswersPolicy = 'Immediately' | 'After Deadline' | 'On Max Attempts' | 'Manual';

export interface ClassExercise {
  id: string; // This is the class_exercises record id
  class_id: string;
  exercise_id: string;
  assigned_at: string;
  due_date?: string | null;
  max_attempts?: number | null;
  minimum_passing_grade?: number | null;
  time_limit?: number | null;
  randomize_questions?: boolean;
  show_answers_policy?: ShowAnswersPolicy;
  exercise: Exercise; // The full exercise details are nested
}

export type FlatClassExercise = Omit<ClassExercise, 'exercise'> & Exercise;

export type FullClassExercise = Exercise & {
  class_exercise_id: string; // from class_exercises
  due_date: string | null;
  settings: any;
  // Also include fields that might be directly on class_exercises
  max_attempts?: number | null;
  time_limit?: number | null;
  randomize_questions?: boolean;
  show_answers_policy?: ShowAnswersPolicy;
};

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface ClassForm {
  name: string;
  description: string;
}

export interface ExerciseForm {
  title: string;
  description: string;
  subject: string;
  grade: string;
  material?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'all';
  isPublic: boolean;
  tags: string[];
  questions: Question[];
}

// Filter types
export interface ExerciseFilters {
  search?: string;
  subject?: string;
  grade?: string;
  difficulty?: string;
  creator?: string;
  tags?: string[];
}

export interface ClassFilters {
  search?: string;
  teacherId?: string;
}

// State types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface ExerciseState {
  exercises: Exercise[];
  currentExercise: Exercise | null;
  isLoading: boolean;
  error: string | null;
}

export interface ClassState {
  classes: Class[];
  currentClass: Class | null;
  students: User[];
  exercises: Exercise[];
  isLoading: boolean;
  error: string | null;
}
