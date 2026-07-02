-- File: supabase/migrations/20250721084000_final_rls_refactor.sql
-- This script provides a comprehensive fix for all role-checking RLS policies,
-- resolving the dependency error encountered previously.

-- Step 1: Create the definitive helper function to check for teacher role.
-- This version includes SET search_path to make it more robust and prevent RLS recursion.
-- A SECURITY DEFINER function runs with the permissions of the owner. By setting the
-- search_path, we ensure it bypasses any RLS policies on the tables it queries (like public.users).
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
    WHERE id = p_user_id AND role = 'teacher'
  );
END;
$$;

-- Step 2: Drop ALL policies that depend on the old get_user_role() function first.
-- Dependency on 'exercise_attempts'
DROP POLICY IF EXISTS "Teachers can read student attempts in their classes" ON public.exercise_attempts;
-- Dependencies on 'classes'
DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;
DROP POLICY IF EXISTS "Enable read access for teachers and enrolled students" ON public.classes;
DROP POLICY IF EXISTS "Teachers can delete own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can update own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON public.classes;
DROP POLICY IF EXISTS "Enrolled students can view their classes" ON public.classes;

-- Step 3: Now that all dependencies are removed, it is safe to drop the old function.
DROP FUNCTION IF EXISTS public.get_user_role();

-- Step 4: Recreate all necessary policies using the new is_teacher() function.

-- Recreate policy for 'exercise_attempts'
DROP POLICY IF EXISTS "Teachers can view attempts in their classes" ON public.exercise_attempts; -- Make idempotent
CREATE POLICY "Teachers can view attempts in their classes"
ON public.exercise_attempts FOR SELECT
TO authenticated
USING (
  public.is_teacher(auth.uid()) AND
  EXISTS (
    SELECT 1
    FROM public.classes c
    JOIN public.class_students cs ON c.id = cs.class_id
    WHERE c.teacher_id = auth.uid() AND cs.student_id = exercise_attempts.user_id
  )
);

-- Recreate policies for 'classes'


-- Policy for INSERT
CREATE POLICY "Teachers can create classes"
ON public.classes FOR INSERT
TO authenticated
WITH CHECK (
  public.is_teacher(auth.uid()) AND (teacher_id = auth.uid())
);

-- Consolidated policy for SELECT, UPDATE, DELETE for teachers
CREATE POLICY "Teachers can manage their own classes"
ON public.classes FOR ALL
TO authenticated
USING (
  public.is_teacher(auth.uid()) AND (teacher_id = auth.uid())
)
WITH CHECK (
  public.is_teacher(auth.uid()) AND (teacher_id = auth.uid())
);

-- Policy for students to view classes they are enrolled in
CREATE POLICY "Enrolled students can view their classes"
ON public.classes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.class_students
    WHERE class_students.class_id = classes.id
      AND class_students.student_id = auth.uid()
  )
);

-- Step 5: Grant execute permission on the new function and clean up any debug functions.
GRANT EXECUTE ON FUNCTION public.is_teacher(uuid) TO authenticated;
DROP FUNCTION IF EXISTS public.debug_get_jwt_claims();
