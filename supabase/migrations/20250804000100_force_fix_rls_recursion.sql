-- Force fix for infinite recursion - completely fresh approach
-- This uses different policy names to avoid any existing conflicts

-- Step 1: Drop ALL policies on both tables (comprehensive cleanup)
-- Drop all possible policy names on class_students
DROP POLICY IF EXISTS "Students_can_view_own_enrollments_v2" ON public.class_students;
DROP POLICY IF EXISTS "Teachers_can_manage_students_in_their_classes_v2" ON public.class_students;
DROP POLICY IF EXISTS "Students_can_view_own_enrollments" ON public.class_students;
DROP POLICY IF EXISTS "Teachers_can_manage_students_in_their_classes" ON public.class_students;
DROP POLICY IF EXISTS "Students can join classes" ON public.class_students;
DROP POLICY IF EXISTS "Students can read own class enrollments" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can add students to own classes" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can read students in own classes" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can update students in own classes" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can manage students in their own classes" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can SELECT students in their classes" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can INSERT students into their classes" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can DELETE students from their classes" ON public.class_students;

-- Drop all possible policy names on classes
DROP POLICY IF EXISTS "Teachers_can_create_classes_v2" ON public.classes;
DROP POLICY IF EXISTS "Teachers_can_manage_own_classes_v2" ON public.classes;
DROP POLICY IF EXISTS "Students_can_view_enrolled_classes_v2" ON public.classes;
DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can read own classes" ON public.classes;
DROP POLICY IF EXISTS "Students can read enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can update own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can delete own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can SELECT their own classes" ON public.classes;
DROP POLICY IF EXISTS "Enrolled students can view their classes" ON public.classes;
DROP POLICY IF EXISTS "Enable read access for teachers and enrolled students" ON public.classes;

-- Step 2: Create helper function
CREATE OR REPLACE FUNCTION public.is_teacher_helper(p_user_id uuid)
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

GRANT EXECUTE ON FUNCTION public.is_teacher_helper(uuid) TO authenticated;

-- Step 3: Create policies with NEW unique names to avoid conflicts
-- For class_students
CREATE POLICY "cs_student_select_own_20250804"
ON public.class_students
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "cs_teacher_manage_all_20250804"
ON public.class_students
FOR ALL
TO authenticated
USING (
  public.is_teacher_helper(auth.uid()) AND
  EXISTS (SELECT 1 FROM public.classes WHERE id = class_students.class_id AND teacher_id = auth.uid())
)
WITH CHECK (
  public.is_teacher_helper(auth.uid()) AND
  EXISTS (SELECT 1 FROM public.classes WHERE id = class_students.class_id AND teacher_id = auth.uid())
);

-- For classes
CREATE POLICY "class_teacher_create_20250804"
ON public.classes
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_teacher_helper(auth.uid()) AND teacher_id = auth.uid()
);

CREATE POLICY "class_teacher_manage_all_20250804"
ON public.classes
FOR ALL
TO authenticated
USING (
  public.is_teacher_helper(auth.uid()) AND teacher_id = auth.uid()
)
WITH CHECK (
  public.is_teacher_helper(auth.uid()) AND teacher_id = auth.uid()
);

CREATE POLICY "class_student_select_enrolled_20250804"
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

-- Step 4: Grant permissions
GRANT ALL ON public.classes TO authenticated;
GRANT ALL ON public.class_students TO authenticated;

-- Step 5: Verify no recursion
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('classes', 'class_students')
ORDER BY tablename, policyname;