/*
  # Complete User System Setup

  This migration sets up the complete user system required for the EduWorksheets application.
  
  ## What this creates:
  
  1. **Enum Types**
     - `user_role` (teacher, student)
     - `difficulty_level` (easy, medium, hard) 
     - `question_type` (multiple_choice, short_answer, true_false, matching)
  
  2. **Core Tables**
     - `users` table with proper auth integration
     - `exercises` table for educational content
     - `questions` table linked to exercises
     - `classes` table for classroom management
     - `class_students` table for enrollment
     - `class_exercises` table for assignments
     - `exercise_attempts` table for tracking student work
     - `user_progress` table for progress tracking
  
  3. **Security**
     - Row Level Security (RLS) enabled on all tables
     - Comprehensive security policies
     - Proper user access controls
  
  4. **Functions & Triggers**
     - Automatic user profile creation
     - Progress tracking updates
     - Class code generation
     - Timestamp management
  
  5. **Performance**
     - Strategic indexes for query optimization
     - Foreign key constraints for data integrity
*/

-- Create enum types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('teacher', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('multiple_choice', 'short_answer', 'true_false', 'matching');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    role user_role DEFAULT 'student'::user_role NOT NULL,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text DEFAULT '' NOT NULL,
    subject text NOT NULL,
    grade text NOT NULL,
    material text,
    difficulty difficulty_level DEFAULT 'medium'::difficulty_level NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tags text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    type question_type NOT NULL,
    question text NOT NULL,
    correct_answer jsonb NOT NULL,
    options jsonb,
    explanation text,
    difficulty difficulty_level DEFAULT 'medium'::difficulty_level NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text DEFAULT '' NOT NULL,
    teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_code text UNIQUE NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create class_students table
CREATE TABLE IF NOT EXISTS class_students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active boolean DEFAULT true NOT NULL,
    joined_at timestamptz DEFAULT now(),
    UNIQUE(class_id, student_id)
);

-- Create class_exercises table
CREATE TABLE IF NOT EXISTS class_exercises (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    is_active boolean DEFAULT true NOT NULL,
    assigned_at timestamptz DEFAULT now(),
    due_date timestamptz,
    UNIQUE(class_id, exercise_id)
);

-- Create exercise_attempts table
CREATE TABLE IF NOT EXISTS exercise_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
    answers jsonb DEFAULT '[]'::jsonb NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    max_score integer DEFAULT 0 NOT NULL,
    time_elapsed integer DEFAULT 0 NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
    best_score integer DEFAULT 0 NOT NULL,
    attempts_count integer DEFAULT 0 NOT NULL,
    total_time_spent integer DEFAULT 0 NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    first_attempt_at timestamptz,
    last_attempt_at timestamptz,
    completed_at timestamptz,
    UNIQUE(user_id, exercise_id, class_id)
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Public read access to basic user info" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (uid() = id) WITH CHECK (uid() = id);

-- Create RLS policies for exercises table
CREATE POLICY "Users can create exercises" ON exercises FOR INSERT TO authenticated WITH CHECK (creator_id = uid());
CREATE POLICY "Users can read own exercises" ON exercises FOR SELECT TO authenticated USING (creator_id = uid());
CREATE POLICY "Users can read public exercises" ON exercises FOR SELECT TO authenticated USING (is_public = true);
CREATE POLICY "Users can update own exercises" ON exercises FOR UPDATE TO authenticated USING (creator_id = uid()) WITH CHECK (creator_id = uid());
CREATE POLICY "Users can delete own exercises" ON exercises FOR DELETE TO authenticated USING (creator_id = uid());

-- Create RLS policies for questions table
CREATE POLICY "Users can create questions for own exercises" ON questions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = questions.exercise_id AND exercises.creator_id = uid()));
CREATE POLICY "Users can read questions from own exercises" ON questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = questions.exercise_id AND exercises.creator_id = uid()));
CREATE POLICY "Users can read questions from public exercises" ON questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = questions.exercise_id AND exercises.is_public = true));
CREATE POLICY "Users can update questions in own exercises" ON questions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = questions.exercise_id AND exercises.creator_id = uid())) WITH CHECK (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = questions.exercise_id AND exercises.creator_id = uid()));
CREATE POLICY "Users can delete questions from own exercises" ON questions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = questions.exercise_id AND exercises.creator_id = uid()));

-- Create RLS policies for classes table
CREATE POLICY "Teachers can create classes" ON classes FOR INSERT TO authenticated WITH CHECK (teacher_id = uid() AND EXISTS (SELECT 1 FROM users WHERE users.id = uid() AND users.role = 'teacher'::user_role));
CREATE POLICY "Teachers can read own classes" ON classes FOR SELECT TO authenticated USING (teacher_id = uid());
CREATE POLICY "Students can read classes they're enrolled in" ON classes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM class_students WHERE class_students.class_id = classes.id AND class_students.student_id = uid() AND class_students.is_active = true));
CREATE POLICY "Teachers can update own classes" ON classes FOR UPDATE TO authenticated USING (teacher_id = uid()) WITH CHECK (teacher_id = uid());
CREATE POLICY "Teachers can delete own classes" ON classes FOR DELETE TO authenticated USING (teacher_id = uid());

-- Create RLS policies for class_students table
CREATE POLICY "Students can join classes" ON class_students FOR INSERT TO authenticated WITH CHECK (student_id = uid());
CREATE POLICY "Students can read own class enrollments" ON class_students FOR SELECT TO authenticated USING (student_id = uid());
CREATE POLICY "Students can update own enrollments" ON class_students FOR UPDATE TO authenticated USING (student_id = uid()) WITH CHECK (student_id = uid());
CREATE POLICY "Teachers can add students to own classes" ON class_students FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM classes WHERE classes.id = class_students.class_id AND classes.teacher_id = uid()));
CREATE POLICY "Teachers can read students in own classes" ON class_students FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = class_students.class_id AND classes.teacher_id = uid()));
CREATE POLICY "Teachers can update students in own classes" ON class_students FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = class_students.class_id AND classes.teacher_id = uid()));

-- Create RLS policies for class_exercises table
CREATE POLICY "Teachers can assign exercises to own classes" ON class_exercises FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM classes WHERE classes.id = class_exercises.class_id AND classes.teacher_id = uid()));
CREATE POLICY "Teachers can read exercises in own classes" ON class_exercises FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = class_exercises.class_id AND classes.teacher_id = uid()));
CREATE POLICY "Students can read exercises in enrolled classes" ON class_exercises FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM class_students WHERE class_students.class_id = class_exercises.class_id AND class_students.student_id = uid() AND class_students.is_active = true));
CREATE POLICY "Teachers can update exercises in own classes" ON class_exercises FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = class_exercises.class_id AND classes.teacher_id = uid()));
CREATE POLICY "Teachers can remove exercises from own classes" ON class_exercises FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = class_exercises.class_id AND classes.teacher_id = uid()));

-- Create RLS policies for exercise_attempts table
CREATE POLICY "Users can create own attempts" ON exercise_attempts FOR INSERT TO authenticated WITH CHECK (user_id = uid());
CREATE POLICY "Users can read own attempts" ON exercise_attempts FOR SELECT TO authenticated USING (user_id = uid());
CREATE POLICY "Users can update own attempts" ON exercise_attempts FOR UPDATE TO authenticated USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY "Users can delete own attempts" ON exercise_attempts FOR DELETE TO authenticated USING (user_id = uid());
CREATE POLICY "Teachers can read student attempts in their classes" ON exercise_attempts FOR SELECT TO authenticated USING (class_id IS NOT NULL AND EXISTS (SELECT 1 FROM classes WHERE classes.id = exercise_attempts.class_id AND classes.teacher_id = uid()));

-- Create RLS policies for user_progress table
CREATE POLICY "Users can create own progress" ON user_progress FOR INSERT TO authenticated WITH CHECK (user_id = uid());
CREATE POLICY "Users can read own progress" ON user_progress FOR SELECT TO authenticated USING (user_id = uid());
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE TO authenticated USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY "Teachers can read student progress in their classes" ON user_progress FOR SELECT TO authenticated USING (class_id IS NOT NULL AND EXISTS (SELECT 1 FROM classes WHERE classes.id = user_progress.class_id AND classes.teacher_id = uid()));

-- Create functions for user management
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'student'::user_role)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function for class code generation
CREATE OR REPLACE FUNCTION set_class_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.class_code IS NULL OR NEW.class_code = '' THEN
    NEW.class_code = upper(substring(md5(random()::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_class_update()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_exercise_update()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function for attempt completion
CREATE OR REPLACE FUNCTION handle_attempt_completion()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    NEW.completed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function for progress tracking
CREATE OR REPLACE FUNCTION update_user_progress()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_progress (
    user_id,
    exercise_id,
    class_id,
    best_score,
    attempts_count,
    total_time_spent,
    is_completed,
    first_attempt_at,
    last_attempt_at,
    completed_at
  )
  VALUES (
    NEW.user_id,
    NEW.exercise_id,
    NEW.class_id,
    NEW.score,
    1,
    NEW.time_elapsed,
    NEW.is_completed,
    NEW.started_at,
    COALESCE(NEW.completed_at, NEW.started_at),
    NEW.completed_at
  )
  ON CONFLICT (user_id, exercise_id, class_id)
  DO UPDATE SET
    best_score = GREATEST(user_progress.best_score, NEW.score),
    attempts_count = user_progress.attempts_count + 1,
    total_time_spent = user_progress.total_time_spent + NEW.time_elapsed,
    is_completed = CASE WHEN NEW.is_completed THEN true ELSE user_progress.is_completed END,
    last_attempt_at = COALESCE(NEW.completed_at, NEW.started_at),
    completed_at = CASE WHEN NEW.is_completed AND user_progress.completed_at IS NULL THEN NEW.completed_at ELSE user_progress.completed_at END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS on_user_updated ON users;
CREATE TRIGGER on_user_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION handle_user_update();

DROP TRIGGER IF EXISTS on_class_code_generation ON classes;
CREATE TRIGGER on_class_code_generation
  BEFORE INSERT ON classes
  FOR EACH ROW EXECUTE FUNCTION set_class_code();

DROP TRIGGER IF EXISTS on_class_updated ON classes;
CREATE TRIGGER on_class_updated
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION handle_class_update();

DROP TRIGGER IF EXISTS on_exercise_updated ON exercises;
CREATE TRIGGER on_exercise_updated
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION handle_exercise_update();

DROP TRIGGER IF EXISTS on_attempt_completed ON exercise_attempts;
CREATE TRIGGER on_attempt_completed
  BEFORE UPDATE ON exercise_attempts
  FOR EACH ROW EXECUTE FUNCTION handle_attempt_completion();

DROP TRIGGER IF EXISTS on_attempt_progress_update ON exercise_attempts;
CREATE TRIGGER on_attempt_progress_update
  AFTER INSERT OR UPDATE ON exercise_attempts
  FOR EACH ROW EXECUTE FUNCTION update_user_progress();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);

CREATE INDEX IF NOT EXISTS idx_exercises_creator_id ON exercises(creator_id);
CREATE INDEX IF NOT EXISTS idx_exercises_is_public ON exercises(is_public);
CREATE INDEX IF NOT EXISTS idx_exercises_subject ON exercises(subject);
CREATE INDEX IF NOT EXISTS idx_exercises_grade ON exercises(grade);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_created_at ON exercises(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_exercise_id ON questions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_order_index ON questions(exercise_id, order_index);

CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_class_code ON classes(class_code);
CREATE INDEX IF NOT EXISTS idx_classes_is_active ON classes(is_active);

CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_class_students_is_active ON class_students(is_active);

CREATE INDEX IF NOT EXISTS idx_class_exercises_class_id ON class_exercises(class_id);
CREATE INDEX IF NOT EXISTS idx_class_exercises_exercise_id ON class_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_class_exercises_is_active ON class_exercises(is_active);

CREATE INDEX IF NOT EXISTS idx_exercise_attempts_user_id ON exercise_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_exercise_id ON exercise_attempts(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_class_id ON exercise_attempts(class_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_is_completed ON exercise_attempts(is_completed);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_started_at ON exercise_attempts(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_completed_at ON exercise_attempts(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_exercise_id ON user_progress(exercise_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_class_id ON user_progress(class_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_is_completed ON user_progress(is_completed);
CREATE INDEX IF NOT EXISTS idx_user_progress_best_score ON user_progress(best_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_last_attempt_at ON user_progress(last_attempt_at DESC);