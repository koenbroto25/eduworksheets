-- Fix uid() function references - replace with auth.uid()
-- This migration fixes the "function uid() does not exist" error

-- Drop existing policies that use uid()
DROP POLICY IF EXISTS "Public read access to basic user info" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can create exercises" ON exercises;
DROP POLICY IF EXISTS "Users can read own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can read public exercises" ON exercises;
DROP POLICY IF EXISTS "Users can update own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can delete own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can create questions for own exercises" ON questions;
DROP POLICY IF EXISTS "Users can read questions from own exercises" ON questions;
DROP POLICY IF EXISTS "Users can read questions from public exercises" ON questions;
DROP POLICY IF EXISTS "Users can update questions in own exercises" ON questions;
DROP POLICY IF EXISTS "Users can delete questions from own exercises" ON questions;
DROP POLICY IF EXISTS "Teachers can create classes" ON classes;
DROP POLICY IF EXISTS "Teachers can read own classes" ON classes;
DROP POLICY IF EXISTS "Students can read classes they're enrolled in" ON classes;
DROP POLICY IF EXISTS "Teachers can update own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can delete own classes" ON classes;
DROP POLICY IF EXISTS "Students can join classes" ON class_students;
DROP POLICY IF EXISTS "Students can read own class enrollments" ON class_students;
DROP POLICY IF EXISTS "Students can update own enrollments" ON class_students;
DROP POLICY IF EXISTS "Teachers can add students to own classes" ON class_students;
DROP POLICY IF EXISTS "Teachers can read students in own classes" ON class_students;
DROP POLICY IF EXISTS "Teachers can update students in own classes" ON class_students;
DROP POLICY IF EXISTS "Teachers can assign exercises to own classes" ON class_exercises;
DROP POLICY IF EXISTS "Teachers can read exercises in own classes" ON class_exercises;
DROP POLICY IF EXISTS "Students can read exercises in enrolled classes" ON class_exercises;
DROP POLICY IF EXISTS "Teachers can update exercises in own classes" ON class_exercises;
DROP POLICY IF EXISTS "Teachers can remove exercises from own classes" ON class_exercises;
DROP POLICY IF EXISTS "Users can create own attempts" ON exercise_attempts;
DROP POLICY IF EXISTS "Users can read own attempts" ON exercise_attempts;
DROP POLICY IF EXISTS "Users can update own attempts" ON exercise_attempts;
DROP POLICY IF EXISTS "Users can delete own attempts" ON exercise_attempts;
DROP POLICY IF EXISTS "Teachers can read student attempts in their classes" ON exercise_attempts;
DROP POLICY IF EXISTS "Users can create own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can read own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
DROP POLICY IF EXISTS "Teachers can read student progress in their classes" ON user_progress;

-- Recreate policies with correct auth.uid() function
-- Users table policies
CREATE POLICY "Public read access to basic user info" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Exercises table policies
CREATE POLICY "Users can create exercises" ON exercises FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Users can read own exercises" ON exercises FOR SELECT TO authenticated USING (creator_id = auth.uid());
CREATE POLICY "Users can read public exercises" ON exercises FOR SELECT TO authenticated USING (is_public = true);
CREATE POLICY "Users can update own exercises" ON exercises FOR UPDATE TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Users can delete own exercises" ON exercises FOR DELETE TO authenticated USING (creator_id = auth.uid());

-- Questions table policies
CREATE POLICY "Users can create questions for own exercises" ON questions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = questions.exercise_id AND exercises.creator_id = auth.uid()));
CREATE POLICY "Users can read questions from own exercises" ON questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = questions.exercise_id AND exercises.creator_id = auth.uid()));
CREATE POLICY "Users can read questions from public exercises" ON questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = questions.exercise_id AND exercises.is_public = true));
CREATE POLICY "Users can update questions in own exercises" ON questions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = questions.exercise_id AND exercises.creator_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = questions.exercise_id AND exercises.creator_id = auth.uid()));
CREATE POLICY "Users can delete questions from own exercises" ON questions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = questions.exercise_id AND exercises.creator_id = auth.uid()));

-- Classes table policies
CREATE POLICY "Teachers can create classes" ON classes FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid() AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'teacher'::user_role));
CREATE POLICY "Teachers can read own classes" ON classes FOR SELECT TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Students can read classes they're enrolled in" ON classes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM class_students WHERE class_students.class_id = classes.id AND class_students.student_id = auth.uid() AND class_students.is_active = true));
CREATE POLICY "Teachers can update own classes" ON classes FOR UPDATE TO authenticated USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Teachers can delete own classes" ON classes FOR DELETE TO authenticated USING (teacher_id = auth.uid());

-- Class students table policies
CREATE POLICY "Students can join classes" ON class_students FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can read own class enrollments" ON class_students FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Students can update own enrollments" ON class_students FOR UPDATE TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "Teachers can add students to own classes" ON class_students FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM classes WHERE classes.id = class_students.class_id AND classes.teacher_id = auth.uid()));
CREATE POLICY "Teachers can read students in own classes" ON class_students FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = class_students.class_id AND classes.teacher_id = auth.uid()));
CREATE POLICY "Teachers can update students in own classes" ON class_students FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = class_students.class_id AND classes.teacher_id = auth.uid()));

-- Class exercises table policies
CREATE POLICY "Teachers can assign exercises to own classes" ON class_exercises FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM classes WHERE classes.id = class_exercises.class_id AND classes.teacher_id = auth.uid()));
CREATE POLICY "Teachers can read exercises in own classes" ON class_exercises FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = class_exercises.class_id AND classes.teacher_id = auth.uid()));
CREATE POLICY "Students can read exercises in enrolled classes" ON class_exercises FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM class_students WHERE class_students.class_id = class_exercises.class_id AND class_students.student_id = auth.uid() AND class_students.is_active = true));
CREATE POLICY "Teachers can update exercises in own classes" ON class_exercises FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = class_exercises.class_id AND classes.teacher_id = auth.uid()));
CREATE POLICY "Teachers can remove exercises from own classes" ON class_exercises FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = class_exercises.class_id AND classes.teacher_id = auth.uid()));

-- Exercise attempts table policies
CREATE POLICY "Users can create own attempts" ON exercise_attempts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can read own attempts" ON exercise_attempts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own attempts" ON exercise_attempts FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own attempts" ON exercise_attempts FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Teachers can read student attempts in their classes" ON exercise_attempts FOR SELECT TO authenticated USING (class_id IS NOT NULL AND EXISTS (SELECT 1 FROM classes WHERE classes.id = exercise_attempts.class_id AND classes.teacher_id = auth.uid()));

-- User progress table policies
CREATE POLICY "Users can create own progress" ON user_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can read own progress" ON user_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Teachers can read student progress in their classes" ON user_progress FOR SELECT TO authenticated USING (class_id IS NOT NULL AND EXISTS (SELECT 1 FROM classes WHERE classes.id = user_progress.class_id AND classes.teacher_id = auth.uid()));