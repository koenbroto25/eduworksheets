-- Ultimate fix - dynamically drops ALL existing policies
-- Handles function dependencies correctly

-- Step 1: Drop ALL policies on class_students dynamically
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname, tablename
    FROM pg_policies 
    WHERE tablename = 'class_students'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.class_students', policy_record.policyname);
  END LOOP;
END $$;

-- Step 2: Drop ALL policies on classes dynamically
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname, tablename
    FROM pg_policies 
    WHERE tablename = 'classes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.classes', policy_record.policyname);
  END LOOP;
END $$;

-- Step 3: Drop policies on exercise_attempts that depend on is_teacher function
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname, tablename
    FROM pg_policies 
    WHERE tablename = 'exercise_attempts'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.exercise_attempts', policy_record.policyname);
  END LOOP;
END $$;

-- Drop policies on user_progress that might depend on is_teacher
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname, tablename
    FROM pg_policies 
    WHERE tablename = 'user_progress'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_progress', policy_record.policyname);
  END LOOP;
END $$;

-- Step 4: Now safe to drop the old is_teacher function with CASCADE
DROP FUNCTION IF EXISTS public.is_teacher(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_teacher_helper(uuid) CASCADE;

-- Step 5: Create helper function with very unique name
CREATE OR REPLACE FUNCTION public.rls_helper_is_teacher_v20250804(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id AND role = 'teacher'::user_role
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rls_helper_is_teacher_v20250804(uuid) TO authenticated;

-- Step 6: Create fresh policies with timestamp-based names
-- For class_students
CREATE POLICY "pol_cs_student_select_202508040200"
ON public.class_students
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "pol_cs_teacher_manage_202508040200"
ON public.class_students
FOR ALL
TO authenticated
USING (
  public.rls_helper_is_teacher_v20250804(auth.uid()) AND
  EXISTS (SELECT 1 FROM public.classes WHERE id = class_students.class_id AND teacher_id = auth.uid())
)
WITH CHECK (
  public.rls_helper_is_teacher_v20250804(auth.uid()) AND
  EXISTS (SELECT 1 FROM public.classes WHERE id = class_students.class_id AND teacher_id = auth.uid())
);

-- For classes
CREATE POLICY "pol_class_teacher_create_202508040200"
ON public.classes
FOR INSERT
TO authenticated
WITH CHECK (
  public.rls_helper_is_teacher_v20250804(auth.uid()) AND teacher_id = auth.uid()
);

CREATE POLICY "pol_class_teacher_manage_202508040200"
ON public.classes
FOR ALL
TO authenticated
USING (
  public.rls_helper_is_teacher_v20250804(auth.uid()) AND teacher_id = auth.uid()
)
WITH CHECK (
  public.rls_helper_is_teacher_v20250804(auth.uid()) AND teacher_id = auth.uid()
);

CREATE POLICY "pol_class_student_select_202508040200"
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

-- Step 7: Grant permissions
GRANT ALL ON public.classes TO authenticated;
GRANT ALL ON public.class_students TO authenticated;

-- Step 8: Verification
SELECT 
  'SUCCESS: Policies created for:' as info,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('classes', 'class_students')
ORDER BY tablename, cmd, policyname;