ALTER TABLE public.class_exercises
ADD COLUMN IF NOT EXISTS max_attempts INTEGER,
ADD COLUMN IF NOT EXISTS minimum_passing_grade INTEGER,
ADD COLUMN IF NOT EXISTS settings JSONB;

-- Update due_date column type if it exists, otherwise add it.
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='class_exercises' AND column_name='due_date') THEN
    ALTER TABLE public.class_exercises ALTER COLUMN due_date TYPE TIMESTAMPTZ USING due_date::TIMESTAMPTZ;
  ELSE
    ALTER TABLE public.class_exercises ADD COLUMN due_date TIMESTAMPTZ;
  END IF;
END $$;
