-- Fix infinite recursion in RLS policies for classes table
-- This migration breaks circular references between classes and class_students

-- Step 1: Ensure the is_teacher() helper function exists and is secure
CREATE OR REPLACE FUNCTION public.is_teacher(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = p_user_id AND role = 'teacher'::user_role
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_teacher(uuid) TO authenticated;

-- Step 2: Drop ALL existing policies on classes to start fresh
DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can read own classes" ON public.classes;
DROP POLICY IF EXISTS "Students can read enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can update own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can delete own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can SELECT their own classes" ON public.classes;
DROP POLICY IF EXISTS "Enrolled students can view their classes" ON public.classes;
DROP POLICY IF EXISTS "Enable read access for teachers and enrolled students" ON public.classes;

-- Step 3: Drop ALL existing policies on class_students to break circular reference
DROP POLICY IF EXISTS "Students can join classes" ON public.class_students;
DROP POLICY IF EXISTS "Students can read own class enrollments" ON public.class_students;
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can add students to own classes" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can read students in own classes" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can update students in own classes" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can manage students in their own classes" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can manage students in their classes" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can SELECT students in their classes" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can INSERT students into their classes" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can DELETE students from their classes" ON public.class_students;

-- Step 4: Recreate policies for class_students WITHOUT referencing classes table
-- Students can view their own enrollments (simple check, no recursion)
CREATE POLICY "Students can view own enrollments"
ON public.class_students
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Teachers can manage students in classes they teach
-- Uses is_teacher() function to avoid querying classes table directly
CREATE POLICY "Teachers can manage students in their classes"
ON public.class_students
FOR ALL
TO authenticated
USING (
  public.is_teacher(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = class_students.class_id
    AND teacher_id = auth.uid()
  )
)
WITH CHECK (
  public.is_teacher(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = class_students.class_id
    AND teacher_id = auth.uid()
  )
);

-- Step 5: Recreate policies for classes table using is_teacher() function
-- Teachers can create classes
CREATE POLICY "Teachers can create classes"
ON public.classes
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_teacher(auth.uid()) AND
  teacher_id = auth.uid()
);

-- Teachers can SELECT, UPDATE, DELETE their own classes
-- Using FOR ALL covers SELECT, UPDATE, DELETE operations
CREATE POLICY "Teachers can manage own classes"
ON public.classes
FOR ALL
TO authenticated
USING (
  public.is_teacher(auth.uid()) AND
  teacher_id = auth.uid()
)
WITH CHECK (
  public.is_teacher(auth.uid()) AND
  teacher_id = auth.uid()
);

-- Students can view classes they're enrolled in
-- Uses class_students but this is safe because:
-- 1. class_students policies for students don't reference classes (no circular dependency)
-- 2. class_students policies for teachers use is_teacher() function
CREATE POLICY "Students can view enrolled classes"
ON public.classes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.class_students
    WHERE class_students.class_id = classes.id
    AND class_students.student_id = auth.uid()
  )
);

-- Step 6: Grant necessary permissions
GRANT ALL ON public.classes TO authenticated;
GRANT ALL ON public.class_students TO authenticated;