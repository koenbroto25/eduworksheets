-- 1. Create the ENUM type
CREATE TYPE public.curriculum_options AS ENUM (
    'Kurikulum Merdeka Belajar',
    'Kurikulum Deep Learning',
    'Cambridge International Curriculum (CAIE)',
    'International Baccalaureate (IB)'
);

-- 2. Add the new column to the exercises table
ALTER TABLE public.exercises
ADD COLUMN curriculum_type public.curriculum_options;

-- 3. (Optional) Move existing data from metadata to the new column
UPDATE public.exercises
SET curriculum_type = (metadata->>'curriculum')::public.curriculum_options
WHERE metadata->>'curriculum' IS NOT NULL
AND metadata->>'curriculum' IN (
    'Kurikulum Merdeka Belajar',
    'Kurikulum Deep Learning',
    'Cambridge International Curriculum (CAIE)',
    'International Baccalaureate (IB)'
);

-- 4. (Optional) Remove the old curriculum key from metadata
UPDATE public.exercises
SET metadata = metadata - 'curriculum'
WHERE metadata ? 'curriculum';
