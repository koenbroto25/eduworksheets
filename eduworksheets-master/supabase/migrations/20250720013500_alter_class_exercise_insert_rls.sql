-- This migration alters the existing RLS policy for inserting into class_exercises.
-- It adds a WITH CHECK condition to ensure only the class teacher can assign an exercise.

ALTER POLICY "Teachers can assign exercises to own classes" ON public.class_exercises
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.classes
    WHERE
      classes.id = class_exercises.class_id AND
      classes.teacher_id = auth.uid()
  )
);
