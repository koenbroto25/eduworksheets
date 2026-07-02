-- 1. Create the ENUM type
DO $$ BEGIN
    CREATE TYPE public.curriculum_options AS ENUM (
        'Kurikulum Merdeka Belajar',
        'Kurikulum Deep Learning',
        'Cambridge International Curriculum (CAIE)',
        'International Baccalaureate (IB)'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add the new column to the exercises table
ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS curriculum_type public.curriculum_options;

-- 3. SKIPPED: metadata column does not exist in exercises table
-- 4. SKIPPED: metadata column does not exist in exercises table