/*
  # Complete EduWorksheets Database Setup
  
  This migration creates the complete database schema for EduWorksheets including:
  
  1. Enum Types
     - user_role (teacher, student)
     - difficulty_level (easy, medium, hard)
     - question_type (multiple_choice, short_answer, true_false, matching)
  
  2. Core Tables
     - users (user profiles with roles)
     - exercises (educational content)
     - questions (exercise questions)
     - classes (virtual classrooms)
     - class_students (student enrollments)
     - class_exercises (exercise assignments)
     - exercise_attempts (student submissions)
     - user_progress (progress tracking)
  
  3. Security
     - Row Level Security (RLS) enabled on all tables
     - Comprehensive access policies
     - Role-based permissions
  
  4. Automation
     - Triggers for user creation
     - Progress tracking automation
     - Timestamp management
     - Class code generation
  
  5. Performance
     - Strategic indexes for fast queries
     - Optimized for common access patterns
*/

-- =====================================================
-- 1. CREATE ENUM TYPES
-- =====================================================

-- Create user role enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('teacher', 'student');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'user_role type already exists, skipping...';
END $$;

-- Create difficulty level enum
DO $$ BEGIN
    CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'difficulty_level type already exists, skipping...';
END $$;

-- Create question type enum
DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('multiple_choice', 'short_answer', 'true_false', 'matching');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'question_type type already exists, skipping...';
END $$;

-- =====================================================
-- 2. CREATE CORE TABLES
-- =====================================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    role user_role DEFAULT 'student'::user_role NOT NULL,
    avatar_url text,
    bio text,
    school text,
    grade_level text,
    subjects text[],
    preferences jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true NOT NULL,
    last_login timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text DEFAULT '' NOT NULL,
    subject text NOT NULL,
    grade text NOT NULL,
    material text,
    difficulty difficulty_level DEFAULT 'medium'::difficulty_level NOT NULL,
    estimated_duration integer DEFAULT 30, -- in minutes
    is_public boolean DEFAULT false NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tags text[] DEFAULT '{}',
    metadata jsonb DEFAULT '{}'::jsonb,
    view_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    type question_type NOT NULL,
    question text NOT NULL,
    correct_answer jsonb NOT NULL,
    options jsonb,
    explanation text,
    hints text[],
    difficulty difficulty_level DEFAULT 'medium'::difficulty_level NOT NULL,
    points integer DEFAULT 1,
    order_index integer DEFAULT 0 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text DEFAULT '' NOT NULL,
    teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_code text UNIQUE NOT NULL,
    subject text,
    grade_level text,
    school_year text,
    semester text,
    max_students integer DEFAULT 50,
    is_active boolean DEFAULT true NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Class students junction table
CREATE TABLE IF NOT EXISTS class_students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active boolean DEFAULT true NOT NULL,
    role text DEFAULT 'student',
    joined_at timestamptz DEFAULT now(),
    left_at timestamptz,
    UNIQUE(class_id, student_id)
);

-- Class exercises junction table
CREATE TABLE IF NOT EXISTS class_exercises (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    is_active boolean DEFAULT true NOT NULL,
    is_required boolean DEFAULT true NOT NULL,
    assigned_at timestamptz DEFAULT now(),
    due_date timestamptz,
    available_from timestamptz DEFAULT now(),
    available_until timestamptz,
    max_attempts integer,
    time_limit integer, -- in minutes
    settings jsonb DEFAULT '{}'::jsonb,
    UNIQUE(class_id, exercise_id)
);

-- Exercise attempts table
CREATE TABLE IF NOT EXISTS exercise_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
    attempt_number integer DEFAULT 1,
    answers jsonb DEFAULT '[]'::jsonb NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    max_score integer DEFAULT 0 NOT NULL,
    percentage real GENERATED ALWAYS AS (
        CASE 
            WHEN max_score > 0 THEN (score::real / max_score::real) * 100
            ELSE 0
        END
    ) STORED,
    time_elapsed integer DEFAULT 0 NOT NULL, -- in seconds
    is_completed boolean DEFAULT false NOT NULL,
    is_submitted boolean DEFAULT false NOT NULL,
    feedback jsonb DEFAULT '{}'::jsonb,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    submitted_at timestamptz
);

-- User progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
    best_score integer DEFAULT 0 NOT NULL,
    best_percentage real DEFAULT 0 NOT NULL,
    attempts_count integer DEFAULT 0 NOT NULL,
    total_time_spent integer DEFAULT 0 NOT NULL, -- in seconds
    average_score real DEFAULT 0 NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    is_mastered boolean DEFAULT false NOT NULL,
    first_attempt_at timestamptz,
    last_attempt_at timestamptz,
    completed_at timestamptz,
    mastered_at timestamptz,
    UNIQUE(user_id, exercise_id, class_id)
);

-- Exercise likes table
CREATE TABLE IF NOT EXISTS exercise_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(exercise_id, user_id)
);

-- Exercise comments table
CREATE TABLE IF NOT EXISTS exercise_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES exercise_comments(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_edited boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_comments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE SECURITY POLICIES
-- =====================================================

-- Users table policies
CREATE POLICY "Public read access to basic user info" ON users 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "Users can read own data" ON users 
    FOR SELECT TO authenticated 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

-- Exercises table policies
CREATE POLICY "Users can create exercises" ON exercises 
    FOR INSERT TO authenticated 
    WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can read own exercises" ON exercises 
    FOR SELECT TO authenticated 
    USING (creator_id = auth.uid());

CREATE POLICY "Users can read public exercises" ON exercises 
    FOR SELECT TO authenticated 
    USING (is_public = true);

CREATE POLICY "Users can update own exercises" ON exercises 
    FOR UPDATE TO authenticated 
    USING (creator_id = auth.uid()) 
    WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can delete own exercises" ON exercises 
    FOR DELETE TO authenticated 
    USING (creator_id = auth.uid());

-- Questions table policies
CREATE POLICY "Users can create questions for own exercises" ON questions 
    FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (
        SELECT 1 FROM exercises 
        WHERE exercises.id = questions.exercise_id 
        AND exercises.creator_id = auth.uid()
    ));

CREATE POLICY "Users can read questions from own exercises" ON questions 
    FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM exercises 
        WHERE exercises.id = questions.exercise_id 
        AND exercises.creator_id = auth.uid()
    ));

CREATE POLICY "Users can read questions from public exercises" ON questions 
    FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM exercises 
        WHERE exercises.id = questions.exercise_id 
        AND exercises.is_public = true
    ));

CREATE POLICY "Users can update questions in own exercises" ON questions 
    FOR UPDATE TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM exercises 
        WHERE exercises.id = questions.exercise_id 
        AND exercises.creator_id = auth.uid()
    ));

CREATE POLICY "Users can delete questions from own exercises" ON questions 
    FOR DELETE TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM exercises 
        WHERE exercises.id = questions.exercise_id 
        AND exercises.creator_id = auth.uid()
    ));

-- Classes table policies
CREATE POLICY "Teachers can create classes" ON classes 
    FOR INSERT TO authenticated 
    WITH CHECK (
        teacher_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'teacher'::user_role
        )
    );

CREATE POLICY "Teachers can read own classes" ON classes 
    FOR SELECT TO authenticated 
    USING (teacher_id = auth.uid());

CREATE POLICY "Students can read enrolled classes" ON classes 
    FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM class_students 
        WHERE class_students.class_id = classes.id 
        AND class_students.student_id = auth.uid() 
        AND class_students.is_active = true
    ));

CREATE POLICY "Teachers can update own classes" ON classes 
    FOR UPDATE TO authenticated 
    USING (teacher_id = auth.uid()) 
    WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own classes" ON classes 
    FOR DELETE TO authenticated 
    USING (teacher_id = auth.uid());

-- Class students policies
CREATE POLICY "Students can join classes" ON class_students 
    FOR INSERT TO authenticated 
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can read own enrollments" ON class_students 
    FOR SELECT TO authenticated 
    USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage students in own classes" ON class_students 
    FOR ALL TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM classes 
        WHERE classes.id = class_students.class_id 
        AND classes.teacher_id = auth.uid()
    ));

-- Class exercises policies
CREATE POLICY "Teachers can assign exercises to own classes" ON class_exercises 
    FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (
        SELECT 1 FROM classes 
        WHERE classes.id = class_exercises.class_id 
        AND classes.teacher_id = auth.uid()
    ));

CREATE POLICY "Teachers can read exercises in own classes" ON class_exercises 
    FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM classes 
        WHERE classes.id = class_exercises.class_id 
        AND classes.teacher_id = auth.uid()
    ));

CREATE POLICY "Students can read exercises in enrolled classes" ON class_exercises 
    FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM class_students 
        WHERE class_students.class_id = class_exercises.class_id 
        AND class_students.student_id = auth.uid() 
        AND class_students.is_active = true
    ));

CREATE POLICY "Teachers can update exercises in own classes" ON class_exercises 
    FOR UPDATE TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM classes 
        WHERE classes.id = class_exercises.class_id 
        AND classes.teacher_id = auth.uid()
    ));

-- Exercise attempts policies
CREATE POLICY "Users can create own attempts" ON exercise_attempts 
    FOR INSERT TO authenticated 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own attempts" ON exercise_attempts 
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own attempts" ON exercise_attempts 
    FOR UPDATE TO authenticated 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Teachers can read student attempts in their classes" ON exercise_attempts 
    FOR SELECT TO authenticated 
    USING (
        class_id IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM classes 
            WHERE classes.id = exercise_attempts.class_id 
            AND classes.teacher_id = auth.uid()
        )
    );

-- User progress policies
CREATE POLICY "Users can read own progress" ON user_progress 
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "Teachers can read student progress in their classes" ON user_progress 
    FOR SELECT TO authenticated 
    USING (
        class_id IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM classes 
            WHERE classes.id = user_progress.class_id 
            AND classes.teacher_id = auth.uid()
        )
    );

-- Exercise likes policies
CREATE POLICY "Users can manage own likes" ON exercise_likes 
    FOR ALL TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "Users can read all likes" ON exercise_likes 
    FOR SELECT TO authenticated 
    USING (true);

-- Exercise comments policies
CREATE POLICY "Users can create comments" ON exercise_comments 
    FOR INSERT TO authenticated 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read comments" ON exercise_comments 
    FOR SELECT TO authenticated 
    USING (NOT is_deleted);

CREATE POLICY "Users can update own comments" ON exercise_comments 
    FOR UPDATE TO authenticated 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 5. CREATE FUNCTIONS
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_name text;
    user_role user_role;
BEGIN
    -- Log the attempt
    RAISE LOG 'Creating user profile for: %', NEW.email;
    
    -- Extract name with fallback
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        'User'
    );
    
    -- Extract role with fallback
    user_role := COALESCE(
        (NEW.raw_user_meta_data->>'role')::user_role,
        'student'::user_role
    );
    
    -- Insert user profile
    INSERT INTO public.users (
        id, 
        email, 
        name, 
        role, 
        created_at, 
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        user_name,
        user_role,
        now(),
        now()
    );
    
    RAISE LOG 'User profile created successfully for: %', NEW.email;
    RETURN NEW;
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE LOG 'User profile already exists for: %', NEW.email;
        RETURN NEW;
    WHEN OTHERS THEN
        RAISE LOG 'Error creating user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user updates
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate class codes
CREATE OR REPLACE FUNCTION generate_class_code()
RETURNS text AS $$
DECLARE
    code text;
    exists boolean;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM classes WHERE class_code = code) INTO exists;
        
        -- Exit loop if code is unique
        IF NOT exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to set class code before insert
CREATE OR REPLACE FUNCTION set_class_code()
RETURNS trigger AS $$
BEGIN
    IF NEW.class_code IS NULL OR NEW.class_code = '' THEN
        NEW.class_code = generate_class_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle class updates
CREATE OR REPLACE FUNCTION handle_class_update()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle exercise updates
CREATE OR REPLACE FUNCTION handle_exercise_update()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle attempt completion
CREATE OR REPLACE FUNCTION handle_attempt_completion()
RETURNS trigger AS $$
BEGIN
    -- Set completed_at when attempt is completed
    IF NEW.is_completed = true AND (OLD.is_completed = false OR OLD.is_completed IS NULL) THEN
        NEW.completed_at = now();
    END IF;
    
    -- Set submitted_at when attempt is submitted
    IF NEW.is_submitted = true AND (OLD.is_submitted = false OR OLD.is_submitted IS NULL) THEN
        NEW.submitted_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update user progress
CREATE OR REPLACE FUNCTION update_user_progress()
RETURNS trigger AS $$
DECLARE
    current_progress user_progress%ROWTYPE;
    new_average real;
    is_mastered boolean := false;
BEGIN
    -- Check if this score indicates mastery (80% or higher)
    IF NEW.percentage >= 80 THEN
        is_mastered := true;
    END IF;
    
    -- Get current progress record
    SELECT * INTO current_progress
    FROM user_progress
    WHERE user_id = NEW.user_id 
    AND exercise_id = NEW.exercise_id 
    AND (class_id = NEW.class_id OR (class_id IS NULL AND NEW.class_id IS NULL));
    
    IF FOUND THEN
        -- Calculate new average score
        new_average := (
            (current_progress.average_score * current_progress.attempts_count) + NEW.score
        ) / (current_progress.attempts_count + 1);
        
        -- Update existing progress
        UPDATE user_progress SET
            best_score = GREATEST(best_score, NEW.score),
            best_percentage = GREATEST(best_percentage, NEW.percentage),
            attempts_count = attempts_count + 1,
            total_time_spent = total_time_spent + NEW.time_elapsed,
            average_score = new_average,
            is_completed = CASE WHEN NEW.is_completed THEN true ELSE is_completed END,
            is_mastered = CASE WHEN is_mastered THEN true ELSE user_progress.is_mastered END,
            last_attempt_at = COALESCE(NEW.completed_at, NEW.started_at),
            completed_at = CASE 
                WHEN NEW.is_completed AND completed_at IS NULL 
                THEN NEW.completed_at 
                ELSE completed_at 
            END,
            mastered_at = CASE 
                WHEN is_mastered AND mastered_at IS NULL 
                THEN now() 
                ELSE mastered_at 
            END
        WHERE user_id = NEW.user_id 
        AND exercise_id = NEW.exercise_id 
        AND (class_id = NEW.class_id OR (class_id IS NULL AND NEW.class_id IS NULL));
    ELSE
        -- Insert new progress record
        INSERT INTO user_progress (
            user_id,
            exercise_id,
            class_id,
            best_score,
            best_percentage,
            attempts_count,
            total_time_spent,
            average_score,
            is_completed,
            is_mastered,
            first_attempt_at,
            last_attempt_at,
            completed_at,
            mastered_at
        )
        VALUES (
            NEW.user_id,
            NEW.exercise_id,
            NEW.class_id,
            NEW.score,
            NEW.percentage,
            1,
            NEW.time_elapsed,
            NEW.score,
            NEW.is_completed,
            is_mastered,
            NEW.started_at,
            COALESCE(NEW.completed_at, NEW.started_at),
            NEW.completed_at,
            CASE WHEN is_mastered THEN now() ELSE NULL END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update exercise like count
CREATE OR REPLACE FUNCTION update_exercise_like_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE exercises 
        SET like_count = like_count + 1 
        WHERE id = NEW.exercise_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE exercises 
        SET like_count = like_count - 1 
        WHERE id = OLD.exercise_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Manual user creation function (backup)
CREATE OR REPLACE FUNCTION create_user_profile(
    user_id uuid,
    user_email text,
    user_name text DEFAULT NULL,
    user_role user_role DEFAULT 'student'::user_role
)
RETURNS boolean AS $$
DECLARE
    final_name text;
BEGIN
    final_name := COALESCE(
        user_name,
        split_part(user_email, '@', 1),
        'User'
    );
    
    INSERT INTO public.users (id, email, name, role, created_at, updated_at)
    VALUES (user_id, user_email, final_name, user_role, now(), now())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, users.name),
        role = COALESCE(EXCLUDED.role, users.role),
        updated_at = now();
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in create_user_profile: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CREATE TRIGGERS
-- =====================================================

-- User management triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS on_user_updated ON users;
CREATE TRIGGER on_user_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION handle_user_update();

-- Class management triggers
DROP TRIGGER IF EXISTS on_class_code_generation ON classes;
CREATE TRIGGER on_class_code_generation
    BEFORE INSERT ON classes
    FOR EACH ROW EXECUTE FUNCTION set_class_code();

DROP TRIGGER IF EXISTS on_class_updated ON classes;
CREATE TRIGGER on_class_updated
    BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION handle_class_update();

-- Exercise management triggers
DROP TRIGGER IF EXISTS on_exercise_updated ON exercises;
CREATE TRIGGER on_exercise_updated
    BEFORE UPDATE ON exercises
    FOR EACH ROW EXECUTE FUNCTION handle_exercise_update();

-- Attempt and progress triggers
DROP TRIGGER IF EXISTS on_attempt_completed ON exercise_attempts;
CREATE TRIGGER on_attempt_completed
    BEFORE UPDATE ON exercise_attempts
    FOR EACH ROW EXECUTE FUNCTION handle_attempt_completion();

DROP TRIGGER IF EXISTS on_attempt_progress_update ON exercise_attempts;
CREATE TRIGGER on_attempt_progress_update
    AFTER INSERT OR UPDATE ON exercise_attempts
    FOR EACH ROW EXECUTE FUNCTION update_user_progress();

-- Like count triggers
DROP TRIGGER IF EXISTS on_exercise_like_change ON exercise_likes;
CREATE TRIGGER on_exercise_like_change
    AFTER INSERT OR DELETE ON exercise_likes
    FOR EACH ROW EXECUTE FUNCTION update_exercise_like_count();

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Exercises table indexes
CREATE INDEX IF NOT EXISTS idx_exercises_creator_id ON exercises(creator_id);
CREATE INDEX IF NOT EXISTS idx_exercises_is_public ON exercises(is_public);
CREATE INDEX IF NOT EXISTS idx_exercises_is_featured ON exercises(is_featured);
CREATE INDEX IF NOT EXISTS idx_exercises_subject ON exercises(subject);
CREATE INDEX IF NOT EXISTS idx_exercises_grade ON exercises(grade);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_created_at ON exercises(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_view_count ON exercises(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_like_count ON exercises(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_tags ON exercises USING GIN(tags);

-- Questions table indexes
CREATE INDEX IF NOT EXISTS idx_questions_exercise_id ON questions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_order_index ON questions(exercise_id, order_index);

-- Classes table indexes
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_class_code ON classes(class_code);
CREATE INDEX IF NOT EXISTS idx_classes_is_active ON classes(is_active);
CREATE INDEX IF NOT EXISTS idx_classes_is_archived ON classes(is_archived);
CREATE INDEX IF NOT EXISTS idx_classes_created_at ON classes(created_at DESC);

-- Class students table indexes
CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_class_students_is_active ON class_students(is_active);
CREATE INDEX IF NOT EXISTS idx_class_students_joined_at ON class_students(joined_at DESC);

-- Class exercises table indexes
CREATE INDEX IF NOT EXISTS idx_class_exercises_class_id ON class_exercises(class_id);
CREATE INDEX IF NOT EXISTS idx_class_exercises_exercise_id ON class_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_class_exercises_is_active ON class_exercises(is_active);
CREATE INDEX IF NOT EXISTS idx_class_exercises_assigned_at ON class_exercises(assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_class_exercises_due_date ON class_exercises(due_date);

-- Exercise attempts table indexes
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_user_id ON exercise_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_exercise_id ON exercise_attempts(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_class_id ON exercise_attempts(class_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_is_completed ON exercise_attempts(is_completed);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_is_submitted ON exercise_attempts(is_submitted);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_started_at ON exercise_attempts(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_completed_at ON exercise_attempts(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_score ON exercise_attempts(score DESC);

-- User progress table indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_exercise_id ON user_progress(exercise_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_class_id ON user_progress(class_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_is_completed ON user_progress(is_completed);
CREATE INDEX IF NOT EXISTS idx_user_progress_is_mastered ON user_progress(is_mastered);
CREATE INDEX IF NOT EXISTS idx_user_progress_best_score ON user_progress(best_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_last_attempt_at ON user_progress(last_attempt_at DESC);

-- Exercise likes table indexes
CREATE INDEX IF NOT EXISTS idx_exercise_likes_exercise_id ON exercise_likes(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_likes_user_id ON exercise_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_likes_created_at ON exercise_likes(created_at DESC);

-- Exercise comments table indexes
CREATE INDEX IF NOT EXISTS idx_exercise_comments_exercise_id ON exercise_comments(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_comments_user_id ON exercise_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_comments_parent_id ON exercise_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_exercise_comments_created_at ON exercise_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_comments_is_deleted ON exercise_comments(is_deleted);

-- =====================================================
-- 8. INSERT SAMPLE DATA
-- =====================================================

-- Insert sample demo users (these will be created when auth users sign up)
-- The trigger will automatically create profiles for them

-- Insert sample exercises (will be created after demo users exist)
-- This is handled by the application after user signup

-- =====================================================
-- 9. UTILITY FUNCTIONS
-- =====================================================

-- Function to test the setup
CREATE OR REPLACE FUNCTION test_database_setup()
RETURNS text AS $$
DECLARE
    result text := '';
    table_count integer;
    function_count integer;
    trigger_count integer;
    policy_count integer;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'users', 'exercises', 'questions', 'classes', 
        'class_students', 'class_exercises', 'exercise_attempts', 
        'user_progress', 'exercise_likes', 'exercise_comments'
    );
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM pg_proc 
    WHERE proname IN (
        'handle_new_user', 'handle_user_update', 'generate_class_code',
        'set_class_code', 'handle_class_update', 'handle_exercise_update',
        'handle_attempt_completion', 'update_user_progress', 
        'update_exercise_like_count', 'create_user_profile'
    );
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger 
    WHERE tgname IN (
        'on_auth_user_created', 'on_user_updated', 'on_class_code_generation',
        'on_class_updated', 'on_exercise_updated', 'on_attempt_completed',
        'on_attempt_progress_update', 'on_exercise_like_change'
    );
    
    -- Count policies (approximate)
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    result := format(
        'Database setup complete! Tables: %s/10, Functions: %s/10, Triggers: %s/8, Policies: %s',
        table_count, function_count, trigger_count, policy_count
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get database statistics
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE(
    table_name text,
    row_count bigint,
    size_pretty text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::text,
        COALESCE(s.n_tup_ins + s.n_tup_upd - s.n_tup_del, 0) as row_count,
        pg_size_pretty(pg_total_relation_size(c.oid)) as size_pretty
    FROM information_schema.tables t
    LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
    LEFT JOIN pg_class c ON c.relname = t.table_name
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. FINAL VERIFICATION
-- =====================================================

-- Test the setup
SELECT test_database_setup();

-- Show completion message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'EduWorksheets Database Setup Complete!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '✅ 3 Enum types (user_role, difficulty_level, question_type)';
    RAISE NOTICE '✅ 10 Tables with full schema';
    RAISE NOTICE '✅ Row Level Security enabled on all tables';
    RAISE NOTICE '✅ Comprehensive security policies';
    RAISE NOTICE '✅ 10 Functions for automation';
    RAISE NOTICE '✅ 8 Triggers for data management';
    RAISE NOTICE '✅ Strategic indexes for performance';
    RAISE NOTICE '✅ Utility functions for monitoring';
    RAISE NOTICE '';
    RAISE NOTICE 'Your EduWorksheets database is ready!';
    RAISE NOTICE 'You can now test signup at: http://localhost:5173/signup';
    RAISE NOTICE '==============================================';
END $$;