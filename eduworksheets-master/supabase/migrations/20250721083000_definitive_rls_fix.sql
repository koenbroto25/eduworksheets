-- File: supabase/migrations/20250721083000_definitive_rls_fix.sql
-- This is the definitive fix, bypassing any JWT issues by checking the role
-- directly from the public.users table via a helper function.

-- Step 1: Create a function that checks the role in the public.users table.
-- This is the most reliable source of truth for application-level roles.
CREATE OR REPLACE FUNCTION public.is_teacher(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = p_user_id AND role = 'teacher'
  );
END;
$$;

-- Step 2: Drop all previous policies on the 'classes' table for a clean slate.
DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;
DROP POLICY IF EXISTS "Enable read access for teachers and enrolled students" ON public.classes;
DROP POLICY IF EXISTS "Teachers can delete own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can update own classes" ON public.classes;

-- Step 3: Recreate the INSERT policy using the new, reliable helper function.
CREATE POLICY "Teachers can create classes"
ON public.classes FOR INSERT
TO authenticated
WITH CHECK (
  public.is_teacher(auth.uid()) AND (teacher_id = auth.uid())
);

-- Step 4: Recreate the other essential policies for SELECT, UPDATE, DELETE.

-- Teachers can see, update, and delete their own classes.
CREATE POLICY "Teachers can manage their own classes"
ON public.classes FOR ALL
TO authenticated
USING (
  public.is_teacher(auth.uid()) AND (teacher_id = auth.uid())
)
WITH CHECK (
  public.is_teacher(auth.uid()) AND (teacher_id = auth.uid())
);

-- Students can see classes they are a member of.
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

-- Step 5: Grant execute permission on the new function.
GRANT EXECUTE ON FUNCTION public.is_teacher(uuid) TO authenticated;

-- Final cleanup of old/debug functions if they still exist
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.debug_get_jwt_claims();
