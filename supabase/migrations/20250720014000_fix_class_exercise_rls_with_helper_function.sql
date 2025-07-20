-- Step 1: Create a helper function to check if the current user is the teacher of a specific class.
-- This function encapsulates the logic, making the RLS policy cleaner and more reliable.
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(p_class_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classes
    WHERE id = p_class_id AND teacher_id = auth.uid()
  );
$$;

-- Step 2: Drop the old, problematic policy to ensure a clean slate.
-- We drop it first to avoid any conflicts.
DROP POLICY IF EXISTS "Teachers can assign exercises to own classes" ON public.class_exercises;

-- Step 3: Create the definitive INSERT policy using the new helper function.
-- This policy is now simple, readable, and robust.
CREATE POLICY "Teachers can assign exercises to own classes"
ON public.class_exercises
FOR INSERT
TO authenticated
WITH CHECK (public.is_teacher_of_class(class_id));
