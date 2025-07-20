-- [MEMORY BANK: ACTIVE]
-- Step 1: Create the new ENUM type for show_answers_policy
DO $$
BEGIN
    CREATE TYPE public.show_answers_policy_enum AS ENUM (
        'Immediately',
        'After Deadline',
        'On Max Attempts',
        'Manual'
    );
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'type "show_answers_policy_enum" already exists, skipping.';
END
$$;

-- Step 2: Add the new columns to the class_exercises table
ALTER TABLE public.class_exercises
ADD COLUMN IF NOT EXISTS randomize_questions BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS show_answers_policy public.show_answers_policy_enum NOT NULL DEFAULT 'Immediately';

-- Step 3: Migrate existing data from the JSONB column to the new columns
-- This query safely handles cases where settings or its keys are null
UPDATE public.class_exercises
SET
    -- Only update time_limit if it's not null in the JSON
    time_limit = COALESCE((settings->>'time_limit')::integer, time_limit),
    
    -- Update randomize_questions, defaulting to false if not present
    randomize_questions = COALESCE((settings->>'randomize_questions')::boolean, false),
    
    -- Update show_answers_policy, defaulting to 'Immediately' if not present
    show_answers_policy = COALESCE((settings->>'show_answers_policy')::public.show_answers_policy_enum, 'Immediately'::public.show_answers_policy_enum)
WHERE
    -- Only run on rows that have a non-empty settings object
    settings IS NOT NULL AND jsonb_typeof(settings) = 'object' AND settings::text != '{}'::text;

-- Step 4: Drop the old settings column
ALTER TABLE public.class_exercises
DROP COLUMN IF EXISTS settings;
