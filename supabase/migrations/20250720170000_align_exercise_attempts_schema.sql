-- This migration aligns the exercise_attempts table with the refactored progress tracking system.
-- It adds the 'class_exercise_id' column, which is crucial for linking an attempt
-- directly to a specific class assignment, and removes the now-redundant 'class_id'.

-- Step 1: Add the new column, making it nullable for now to handle existing data.
-- It references the primary key of class_exercises.
ALTER TABLE public.exercise_attempts
ADD COLUMN class_exercise_id UUID
REFERENCES public.class_exercises(id) ON DELETE SET NULL;

-- Step 2: Backfill the new column using the existing data.
-- This ensures that historical attempts are correctly associated with their class assignment.
UPDATE public.exercise_attempts ea
SET class_exercise_id = (
  SELECT ce.id
  FROM public.class_exercises ce
  WHERE ce.class_id = ea.class_id AND ce.exercise_id = ea.exercise_id
)
WHERE ea.class_id IS NOT NULL;

-- Step 3: Drop the old policy that depends on the class_id column.
DROP POLICY IF EXISTS "Teachers can read student attempts in their classes" ON public.exercise_attempts;

-- Step 4: Drop the old, redundant class_id column.
ALTER TABLE public.exercise_attempts
DROP COLUMN IF EXISTS class_id;

-- Step 5: Add an index for faster lookups on the new column.
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_class_exercise_id
ON public.exercise_attempts(class_exercise_id);

-- Step 6: Recreate the policy with the correct logic using the new column.
-- This policy allows teachers to see attempts related to their class assignments.
CREATE POLICY "Teachers can read student attempts in their classes"
ON public.exercise_attempts
FOR SELECT
TO authenticated
USING (
  (get_user_role() = 'teacher') AND
  EXISTS (
    SELECT 1
    FROM public.class_exercises ce
    JOIN public.classes c ON ce.class_id = c.id
    WHERE ce.id = exercise_attempts.class_exercise_id
      AND c.teacher_id = auth.uid()
  )
);

COMMENT ON COLUMN public.exercise_attempts.class_exercise_id IS 'Links the attempt to a specific class assignment in class_exercises.';

-- No changes are needed for the trigger or RPC functions as the previous migration
-- (20250720160000) already updated them to use the 'class_exercise_id' column.
-- This migration simply brings the table schema into alignment with that logic.
