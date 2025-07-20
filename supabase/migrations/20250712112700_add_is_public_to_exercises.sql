ALTER TABLE public.exercises
ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT true;

-- Add a comment to the new column for clarity
COMMENT ON COLUMN public.exercises.is_public IS 'Determines if the exercise is visible in the public library. True by default.';
