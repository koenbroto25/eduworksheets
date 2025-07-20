-- Step 1: Drop the dependent RLS policies
DROP POLICY IF EXISTS "Enable read access for teachers and enrolled students" ON public.classes;
DROP POLICY IF EXISTS "Enable read access for class members on exercises" ON public.exercises;
DROP POLICY IF EXISTS "Enable read access for class members on questions" ON public.questions;

-- Step 2: Drop and recreate the function with the correct logic
-- We drop it first to ensure a clean state, avoiding parameter name conflicts.
DROP FUNCTION IF EXISTS public.is_class_member(uuid, uuid);

CREATE OR REPLACE FUNCTION public.is_class_member(p_user_id uuid, p_class_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.classes
    WHERE id = p_class_id AND teacher_id = p_user_id
  ) OR EXISTS (
    SELECT 1
    FROM public.class_students
    WHERE class_id = p_class_id AND student_id = p_user_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission again
GRANT EXECUTE ON FUNCTION public.is_class_member(uuid, uuid) TO authenticated;

-- Step 3: Recreate the RLS policies using the corrected function
CREATE POLICY "Enable read access for teachers and enrolled students"
ON public.classes FOR SELECT
TO authenticated
USING (is_class_member(auth.uid(), id));

CREATE POLICY "Enable read access for class members on exercises"
ON public.exercises FOR SELECT
TO authenticated
USING (
  is_public OR
  EXISTS (
    SELECT 1
    FROM public.class_exercises ce
    WHERE ce.exercise_id = id AND is_class_member(auth.uid(), ce.class_id)
  )
);

CREATE POLICY "Enable read access for class members on questions"
ON public.questions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.exercises e
    JOIN public.class_exercises ce ON e.id = ce.exercise_id
    WHERE questions.exercise_id = e.id AND is_class_member(auth.uid(), ce.class_id)
  )
);
