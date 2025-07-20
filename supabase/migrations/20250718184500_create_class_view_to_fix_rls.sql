-- Step 1: Create a view that combines classes with their student counts.
-- This pre-calculates the count, avoiding the need for a nested select in the API call
-- which is the source of the RLS recursion issue.
CREATE OR REPLACE VIEW public.classes_with_student_count AS
SELECT
  c.*,
  (SELECT count(*) FROM public.class_students cs WHERE cs.class_id = c.id) as student_count
FROM
  public.classes c;

-- Step 2: Apply RLS policies to the new VIEW.
-- These policies are simpler and will not cause recursion.

-- First, ensure the view is clean.
DROP POLICY IF EXISTS "Teachers can select classes with count" ON public.classes_with_student_count;
DROP POLICY IF EXISTS "Students can select classes with count" ON public.classes_with_student_count;

-- Policy for Teachers on the VIEW
CREATE POLICY "Teachers can select classes with count"
ON public.classes_with_student_count
FOR SELECT TO authenticated
USING (teacher_id = auth.uid());

-- Policy for Students on the VIEW
-- This policy checks class_students, but because the main query is on the VIEW,
-- it no longer creates a circular dependency with the RLS on the classes table.
CREATE POLICY "Students can select classes with count"
ON public.classes_with_student_count
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.class_students
    WHERE class_students.class_id = classes_with_student_count.id
    AND class_students.student_id = auth.uid()
  )
);
