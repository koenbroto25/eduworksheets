ALTER TABLE public.exercise_attempts
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

-- Add comments to explain the new columns
COMMENT ON COLUMN public.exercise_attempts.class_id IS 'Links the attempt to a specific class assignment.';
COMMENT ON COLUMN public.user_progress.class_id IS 'Links the progress record to a specific class assignment.';
