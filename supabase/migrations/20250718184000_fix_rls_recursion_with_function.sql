-- Step 1: Create a function to get all class IDs for the current student.
-- This acts as a security barrier to break the recursive dependency.
CREATE OR REPLACE FUNCTION get_student_class_ids()
RETURNS uuid[] AS $$
DECLARE
  class_ids_array uuid[];
BEGIN
  SELECT array_agg(class_id)
  INTO class_ids_array
  FROM public.class_students
  WHERE student_id = auth.uid();
  
  RETURN class_ids_array;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop the old, problematic policies on the 'classes' table.
DROP POLICY IF EXISTS "Students can see classes they are enrolled in" ON public.classes;
DROP POLICY IF EXISTS "Teachers can see their own classes" ON public.classes;
-- Add any other SELECT policies on 'classes' here if they exist.

-- Step 3: Create new, non-recursive policies on the 'classes' table.
-- Policy for Teachers remains simple.
CREATE POLICY "Teachers can SELECT their own classes"
ON public.classes FOR SELECT
TO authenticated
USING (teacher_id = auth.uid());

-- Policy for Students now uses the function, breaking the recursion.
CREATE POLICY "Students can SELECT classes they are enrolled in"
ON public.classes FOR SELECT
TO authenticated
USING (id = ANY (get_student_class_ids()));
