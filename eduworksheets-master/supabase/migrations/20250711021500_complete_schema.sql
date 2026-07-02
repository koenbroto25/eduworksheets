-- Create enum types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('teacher', 'student', 'parent');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'user_role type already exists, skipping...';
END $$;

DO $$ BEGIN
    CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'difficulty_level type already exists, skipping...';
END $$;

DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('multiple_choice', 'short_answer', 'true_false', 'matching');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'question_type type already exists, skipping...';
END $$;

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
    updated_at timestamptz DEFAULT now(),
    child_code TEXT
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
    updated_at timestamptz DEFAULT now(),
    assessment_type TEXT
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    type TEXT,
    question TEXT,
    options JSONB,
    answer JSONB,
    explanation TEXT,
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

-- Table for class announcements
CREATE TABLE class_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES users(id) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buat tabel baru parent_child_link
CREATE TABLE IF NOT EXISTS public.parent_child_link (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    parent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_parent_child_link UNIQUE (parent_id, child_id)
);

CREATE TABLE parent_assignments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    score INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Parent Invitations Table
CREATE TABLE parent_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    child_email TEXT,
    child_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
ALTER TABLE exercise_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_child_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_invitations ENABLE ROW LEVEL SECURITY;

-- Users table policies
DROP POLICY IF EXISTS "Public read access to basic user info" ON users;
CREATE POLICY "Public read access to basic user info" ON users 
    FOR SELECT TO authenticated 
    USING (true);

DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users 
    FOR SELECT TO authenticated 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

-- Exercises table policies
DROP POLICY IF EXISTS "Users can create exercises" ON exercises;
CREATE POLICY "Users can create exercises" ON exercises 
    FOR INSERT TO authenticated 
    WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can read own exercises" ON exercises;
CREATE POLICY "Users can read own exercises" ON exercises 
    FOR SELECT TO authenticated 
    USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can read public exercises" ON exercises;
CREATE POLICY "Users can read public exercises" ON exercises 
    FOR SELECT TO authenticated 
    USING (is_public = true);

DROP POLICY IF EXISTS "Users can update own exercises" ON exercises;
CREATE POLICY "Users can update own exercises" ON exercises 
    FOR UPDATE TO authenticated 
    USING (creator_id = auth.uid()) 
    WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own exercises" ON exercises;
CREATE POLICY "Users can delete own exercises" ON exercises 
    FOR DELETE TO authenticated 
    USING (creator_id = auth.uid());

-- Questions table policies
DROP POLICY IF EXISTS "Users can create questions for own exercises" ON questions;
CREATE POLICY "Users can create questions for own exercises" ON questions 
    FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (
        SELECT 1 FROM exercises 
        WHERE exercises.id = questions.exercise_id 
        AND exercises.creator_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can read questions from own exercises" ON questions;
CREATE POLICY "Users can read questions from own exercises" ON questions 
    FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM exercises 
        WHERE exercises.id = questions.exercise_id 
        AND exercises.creator_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can read questions from public exercises" ON questions;
CREATE POLICY "Users can read questions from public exercises" ON questions 
    FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM exercises 
        WHERE exercises.id = questions.exercise_id 
        AND exercises.is_public = true
    ));

DROP POLICY IF EXISTS "Users can update questions in own exercises" ON questions;
CREATE POLICY "Users can update questions in own exercises" ON questions 
    FOR UPDATE TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM exercises 
        WHERE exercises.id = questions.exercise_id 
        AND exercises.creator_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can delete questions from own exercises" ON questions;
CREATE POLICY "Users can delete questions from own exercises" ON questions 
    FOR DELETE TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM exercises 
        WHERE exercises.id = questions.exercise_id 
        AND exercises.creator_id = auth.uid()
    ));

-- Classes table policies
DROP POLICY IF EXISTS "Teachers can create classes" ON classes;
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

DROP POLICY IF EXISTS "Teachers can read own classes" ON classes;
CREATE POLICY "Teachers can read own classes" ON classes 
    FOR SELECT TO authenticated 
    USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Students can read enrolled classes" ON classes;
CREATE POLICY "Students can read enrolled classes" ON classes 
    FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM class_students 
        WHERE class_students.class_id = classes.id 
        AND class_students.student_id = auth.uid() 
        AND class_students.is_active = true
    ));

DROP POLICY IF EXISTS "Teachers can update own classes" ON classes;
CREATE POLICY "Teachers can update own classes" ON classes 
    FOR UPDATE TO authenticated 
    USING (teacher_id = auth.uid()) 
    WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can delete own classes" ON classes;
CREATE POLICY "Teachers can delete own classes" ON classes 
    FOR DELETE TO authenticated 
    USING (teacher_id = auth.uid());

-- Class students policies
DROP POLICY IF EXISTS "Students can join classes" ON class_students;
CREATE POLICY "Students can join classes" ON class_students 
    FOR INSERT TO authenticated 
    WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can read own enrollments" ON class_students;
CREATE POLICY "Students can read own enrollments" ON class_students 
    FOR SELECT TO authenticated 
    USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can manage students in own classes" ON class_students;
CREATE POLICY "Teachers can manage students in own classes" ON class_students 
    FOR ALL TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM classes 
        WHERE classes.id = class_students.class_id 
        AND classes.teacher_id = auth.uid()
    ));

-- Class exercises policies
DROP POLICY IF EXISTS "Teachers can assign exercises to own classes" ON class_exercises;
CREATE POLICY "Teachers can assign exercises to own classes" ON class_exercises 
    FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (
        SELECT 1 FROM classes 
        WHERE classes.id = class_exercises.class_id 
        AND classes.teacher_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Teachers can read exercises in own classes" ON class_exercises;
CREATE POLICY "Teachers can read exercises in own classes" ON class_exercises 
    FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM classes 
        WHERE classes.id = class_exercises.class_id 
        AND classes.teacher_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Students can read exercises in enrolled classes" ON class_exercises;
CREATE POLICY "Students can read exercises in enrolled classes" ON class_exercises 
    FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM class_students 
        WHERE class_students.class_id = class_exercises.class_id 
        AND class_students.student_id = auth.uid() 
        AND class_students.is_active = true
    ));

DROP POLICY IF EXISTS "Teachers can update exercises in own classes" ON class_exercises;
CREATE POLICY "Teachers can update exercises in own classes" ON class_exercises 
    FOR UPDATE TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM classes 
        WHERE classes.id = class_exercises.class_id 
        AND classes.teacher_id = auth.uid()
    ));

-- Exercise attempts policies
DROP POLICY IF EXISTS "Users can create own attempts" ON exercise_attempts;
CREATE POLICY "Users can create own attempts" ON exercise_attempts 
    FOR INSERT TO authenticated 
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can read own attempts" ON exercise_attempts;
CREATE POLICY "Users can read own attempts" ON exercise_attempts 
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own attempts" ON exercise_attempts;
CREATE POLICY "Users can update own attempts" ON exercise_attempts 
    FOR UPDATE TO authenticated 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can read student attempts in their classes" ON exercise_attempts;
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
DROP POLICY IF EXISTS "Users can read own progress" ON user_progress;
CREATE POLICY "Users can read own progress" ON user_progress 
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can read student progress in their classes" ON user_progress;
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
DROP POLICY IF EXISTS "Users can manage own likes" ON exercise_likes;
CREATE POLICY "Users can manage own likes" ON exercise_likes 
    FOR ALL TO authenticated 
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can read all likes" ON exercise_likes;
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

-- Policies for class announcements
CREATE POLICY "Teachers can manage announcements for their classes"
ON class_announcements FOR ALL
USING (
    (SELECT teacher_id FROM classes WHERE id = class_id) = auth.uid()
);

CREATE POLICY "Students can view announcements for their classes"
ON class_announcements FOR SELECT
USING (
    id IN (
        SELECT class_id FROM class_students WHERE student_id = auth.uid()
    )
);

-- Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Policies for parent_child_link
DROP POLICY IF EXISTS "Parents can view their own links." ON public.parent_child_link;
CREATE POLICY "Parents can view their own links."
ON public.parent_child_link FOR SELECT
TO authenticated
USING (parent_id = auth.uid());

-- Anak dapat melihat link mereka sendiri.
DROP POLICY IF EXISTS "Children can view their own links." ON public.parent_child_link;
CREATE POLICY "Children can view their own links."
ON public.parent_child_link FOR SELECT
TO authenticated
USING (child_id = auth.uid());

-- Orang tua dapat membuat link.
DROP POLICY IF EXISTS "Parents can create links." ON public.parent_child_link;
CREATE POLICY "Parents can create links."
ON public.parent_child_link FOR INSERT
TO authenticated
WITH CHECK (parent_id = auth.uid());

-- Orang tua dapat menghapus link mereka.
DROP POLICY IF EXISTS "Parents can delete their own links." ON public.parent_child_link;
CREATE POLICY "Parents can delete their own links."
ON public.parent_child_link FOR DELETE
TO authenticated
USING (parent_id = auth.uid());

-- Policies for parent_assignments
CREATE POLICY "Parents can manage their own assignments"
ON parent_assignments
FOR ALL
USING (auth.uid() = parent_id);

CREATE POLICY "Children can view assignments given to them"
ON parent_assignments
FOR SELECT
USING (auth.uid() = child_id);

CREATE POLICY "Enable read access for authenticated users"
ON public.parent_assignments
FOR SELECT
TO authenticated
USING (true);

-- Policies for parent_invitations
CREATE POLICY "Parents can create invitations"
ON parent_invitations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can see their own invitations"
ON public.parent_invitations FOR SELECT
TO authenticated
USING (auth.uid() = parent_id);

-- Children can see invitations meant for them (once accepted)
-- and anyone can see a pending invitation if they have the link (for the acceptance page)
CREATE POLICY "Users can see specific invitations"
ON public.parent_invitations FOR SELECT
TO authenticated
USING (
  (status = 'pending') OR (auth.uid() = child_id)
);

-- Parents can update the status of their invitations (e.g., revoke)
CREATE POLICY "Parents can update their invitations"
ON public.parent_invitations FOR UPDATE
TO authenticated
USING (auth.uid() = parent_id)
WITH CHECK (auth.uid() = parent_id);

-- Children can update the status to 'accepted'
CREATE POLICY "Children can accept invitations"
ON public.parent_invitations FOR UPDATE
TO authenticated
USING (status = 'pending')
WITH CHECK (auth.uid() = child_id AND status = 'accepted');

-- Function to handle new user creation (FIXED WITH SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Function to handle user updates
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS trigger 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Function to generate class codes
CREATE OR REPLACE FUNCTION generate_class_code()
RETURNS text 
LANGUAGE plpgsql
AS $$
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
$$;

-- Function to set class code before insert
CREATE OR REPLACE FUNCTION set_class_code()
RETURNS trigger 
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.class_code IS NULL OR NEW.class_code = '' THEN
        NEW.class_code = generate_class_code();
    END IF;
    RETURN NEW;
END;
$$;

-- Function to handle class updates
CREATE OR REPLACE FUNCTION handle_class_update()
RETURNS trigger 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Function to handle exercise updates
CREATE OR REPLACE FUNCTION handle_exercise_update()
RETURNS trigger 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Function to handle attempt completion
CREATE OR REPLACE FUNCTION handle_attempt_completion()
RETURNS trigger 
LANGUAGE plpgsql
AS $$
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
$$;

-- Function to update user progress
CREATE OR REPLACE FUNCTION update_user_progress()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
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
$$;

-- Manual user creation function (backup)
CREATE OR REPLACE FUNCTION create_user_profile(
    user_id uuid,
    user_email text,
    user_name text DEFAULT NULL,
    user_role user_role DEFAULT 'student'::user_role
)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
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
$$;

-- Trigger to generate a unique child_code for each student
CREATE OR REPLACE FUNCTION generate_random_string(length integer)
RETURNS text AS $$
DECLARE
  chars text[] := '{A,B,C,D,E,F,G,H,I,J,K,L,M,N,P,Q,R,S,T,U,V,W,X,Y,Z,2,3,4,5,6,7,8,9}';
  result text := '';
  i integer := 0;
BEGIN
  FOR i IN 1..length LOOP
    result := result || chars[1+random()*(array_length(chars, 1)-1)];
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a unique child_code
CREATE OR REPLACE FUNCTION generate_unique_child_code()
RETURNS text AS $$
DECLARE
  new_code text;
  is_duplicate boolean;
BEGIN
  LOOP
    new_code := generate_random_string(6);
    SELECT EXISTS (SELECT 1 FROM public.users WHERE child_code = new_code) INTO is_duplicate;
    IF NOT is_duplicate THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set the child_code when a student user is created
CREATE OR REPLACE FUNCTION set_child_code_on_student_creation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' AND NEW.child_code IS NULL THEN
    NEW.child_code := generate_unique_child_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_student_user_created ON public.users;
CREATE TRIGGER on_student_user_created
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION set_child_code_on_student_creation();
