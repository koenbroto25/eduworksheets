import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table names
export const TABLES = {
  USERS: 'users',
  EXERCISES: 'exercises',
  QUESTIONS: 'questions',
  CLASSES: 'classes',
  CLASS_STUDENTS: 'class_students',
  CLASS_EXERCISES: 'class_exercises',
  EXERCISE_ATTEMPTS: 'exercise_attempts',
  USER_PROGRESS: 'user_progress',
  CURRICULUM: 'curriculum',
  NOTIFICATIONS: 'notifications',
  PARENT_ASSIGNMENTS: 'parent_assignments',
  PARENT_INVITATIONS: 'parent_invitations',
  PARENT_CHILD_LINKS: 'parent_child_link',
} as const;
