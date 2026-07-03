-- Minimal surgical fix - only drops and recreates the problematic policies
-- Does NOT touch functions that other tables depend on

-- Step 1: Drop ONLY the policies on classes and class_students
-- (Not touching exercise_attempts or user_progress policies)

-- Drop all policies on classes
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'classes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.classes', policy_record.policyname);
  END LOOP;
END $$;

-- Drop all policies on class_students
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'class_students'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.class_students', policy_record.policyname);
  END LOOP;
END $$;

-- Step 2: Create NEW helper function with unique name (doesn't drop old one)
CREATE OR REPLACE FUNCTION public.rls_check_teacher_v2(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = p_user_id AND role = 'teacher'::user_role
  );
$$;

GRANT EXECUTE ON FUNCTION public.rls_check_teacher_v2(uuid) TO authenticated;

-- Step 3: Create new policies for class_students
CREATE POLICY "cs_select_own_v2"
ON public.class_students
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "cs_teacher_manage_v2"
ON public.class_students
FOR ALL
TO authenticated
USING (
  public.rls_check_teacher_v2(auth.uid()) AND
  EXISTS (SELECT 1 FROM public.classes WHERE id = class_students.class_id AND teacher_id = auth.uid())
)
WITH CHECK (
  public.rls_check_teacher_v2(auth.uid()) AND
  EXISTS (SELECT 1 FROM public.classes WHERE id = class_students.class_id AND teacher_id = auth.uid())
);

-- Step 4: Create new policies for classes
CREATE POLICY "class_teacher_insert_v2"
ON public.classes
FOR INSERT
TO authenticated
WITH CHECK (
  public.rls_check_teacher_v2(auth.uid()) AND teacher_id = auth.uid()
);

CREATE POLICY "class_teacher_all_v2"
ON public.classes
FOR ALL
TO authenticated
USING (
  public.rls_check_teacher_v2(auth.uid()) AND teacher_id = auth.uid()
)
WITH CHECK (
  public.rls_check_teacher_v2(auth.uid()) AND teacher_id = auth.uid()
);

CREATE POLICY "class_student_select_v2"
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

-- Step 5: Grant permissions
GRANT ALL ON public.classes TO authenticated;
GRANT ALL ON public.class_students TO authenticated;

-- Step 6: Verify
SELECT 
  'SUCCESS - New policies:' as status,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('classes', 'class_students')
  AND policyname LIKE '%_v2'
ORDER BY tablename, cmd, policyname;