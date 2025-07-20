-- Drop the faulty insert policy
DROP POLICY "Teachers can assign exercises to own classes" ON public.class_exercises;

-- Create a new insert policy with the correct condition
CREATE POLICY "Teachers can assign exercises to own classes"
ON public.class_exercises
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.classes
    WHERE classes.id = class_exercises.class_id AND classes.teacher_id = auth.uid()
  )
);
