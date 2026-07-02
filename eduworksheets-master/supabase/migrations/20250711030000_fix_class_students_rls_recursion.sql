-- This migration fixes an infinite recursion error in the RLS policy for the class_students table.
-- The error occurred because the policy for teachers was being evaluated for students,
-- leading to a circular dependency between the RLS policies of the 'classes' and 'class_students' tables.

-- Drop the old, problematic policy.
-- It's good practice to drop by name in case the script is run multiple times.
DROP POLICY IF EXISTS "Teachers can manage students in own classes" ON public.class_students;

-- Create a new, correctly scoped policy for teachers.
-- This policy now explicitly checks if the user has the 'teacher' role before proceeding.
-- This prevents the policy from being applied to students, thus breaking the recursive loop.
CREATE POLICY "Teachers can manage students in their own classes" ON public.class_students
FOR ALL
TO authenticated
USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'teacher'::user_role
    AND EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = class_students.class_id AND classes.teacher_id = auth.uid()
    )
)
WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'teacher'::user_role
    AND EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = class_students.class_id AND classes.teacher_id = auth.uid()
    )
);
