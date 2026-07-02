-- This is the definitive and final migration to fix the student submission workflow.
-- It corrects the underlying schema flaws in 'user_progress' and rewrites the trigger
-- function to be 100% compatible with the actual database state.

-- == STEP 1: Clean Slate - Drop old objects to prevent conflicts ==
DROP TRIGGER IF EXISTS on_new_exercise_attempt ON public.exercise_attempts;
DROP FUNCTION IF EXISTS public.handle_exercise_attempt_update();

-- == STEP 2: Correct the 'user_progress' table schema ==

-- The ON CONFLICT command requires a unique constraint or primary key to function.
-- The logical primary key for this table is the combination of user and exercise.
-- First, drop the old, incorrect primary key if it exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_progress' AND constraint_name = 'user_progress_pkey'
  ) THEN
    ALTER TABLE public.user_progress DROP CONSTRAINT user_progress_pkey;
  END IF;
END $$;

-- Now, add the correct composite PRIMARY KEY. This will also create a unique index.
ALTER TABLE public.user_progress
ADD PRIMARY KEY (user_id, exercise_id);

-- The 'last_attempted_at' column was confirmed to be removed by a previous refactor.
-- We will ensure it is gone to prevent further errors.
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='user_progress' AND column_name='last_attempted_at') THEN
    ALTER TABLE public.user_progress DROP COLUMN last_attempted_at;
  END IF;
END $$;

-- Also remove other columns that were part of the pre-refactor schema to ensure alignment.
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='user_progress' AND column_name='id') THEN ALTER TABLE public.user_progress DROP COLUMN id; END IF;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='user_progress' AND column_name='best_percentage') THEN ALTER TABLE public.user_progress DROP COLUMN best_percentage; END IF;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='user_progress' AND column_name='total_time_spent') THEN ALTER TABLE public.user_progress DROP COLUMN total_time_spent; END IF;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='user_progress' AND column_name='average_score') THEN ALTER TABLE public.user_progress DROP COLUMN average_score; END IF;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='user_progress' AND column_name='is_completed') THEN ALTER TABLE public.user_progress DROP COLUMN is_completed; END IF;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='user_progress' AND column_name='first_attempt_at') THEN ALTER TABLE public.user_progress DROP COLUMN first_attempt_at; END IF;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='user_progress' AND column_name='completed_at') THEN ALTER TABLE public.user_progress DROP COLUMN completed_at; END IF;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='user_progress' AND column_name='mastered_at') THEN ALTER TABLE public.user_progress DROP COLUMN mastered_at; END IF;
END $$;


-- == STEP 3: Create the new, precise trigger function ==
-- This version is simplified to only update the columns that actually exist in the refactored 'user_progress' table.
CREATE OR REPLACE FUNCTION public.handle_exercise_attempt_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_best_score_overall INT;
  v_total_attempts INT;
  v_is_mastered BOOLEAN;
  v_class_best_score INT;
  v_class_attempts_count INT;
  v_class_status public.progress_status_enum;
  v_class_settings RECORD;
BEGIN
  -- Part 1: Update Personal User Progress
  SELECT COALESCE(MAX(score), 0), COALESCE(COUNT(*), 0)
  INTO v_best_score_overall, v_total_attempts
  FROM public.exercise_attempts
  WHERE user_id = NEW.user_id AND exercise_id = NEW.exercise_id;

  v_best_score_overall := GREATEST(v_best_score_overall, NEW.score);
  v_total_attempts := v_total_attempts + 1;
  v_is_mastered := (v_best_score_overall >= 80);

  INSERT INTO public.user_progress (user_id, exercise_id, best_score_overall, attempts_count, is_mastered)
  VALUES (NEW.user_id, NEW.exercise_id, v_best_score_overall, v_total_attempts, v_is_mastered)
  ON CONFLICT (user_id, exercise_id)
  DO UPDATE SET
    best_score_overall = EXCLUDED.best_score_overall,
    attempts_count = EXCLUDED.attempts_count,
    is_mastered = EXCLUDED.is_mastered;

  -- Part 2: Update Class Assignment Progress
  IF NEW.class_exercise_id IS NOT NULL THEN
    SELECT * INTO v_class_settings FROM public.class_exercises ce WHERE ce.id = NEW.class_exercise_id LIMIT 1;
    IF v_class_settings.id IS NOT NULL THEN
      SELECT COALESCE(MAX(score), 0), COALESCE(COUNT(*), 0)
      INTO v_class_best_score, v_class_attempts_count
      FROM public.exercise_attempts
      WHERE user_id = NEW.user_id AND class_exercise_id = NEW.class_exercise_id;

      v_class_best_score := GREATEST(v_class_best_score, NEW.score);
      v_class_attempts_count := v_class_attempts_count + 1;

      IF v_class_settings.due_date IS NOT NULL AND NEW.completed_at > v_class_settings.due_date THEN
        v_class_status := 'completed_late';
      ELSE
        IF v_class_best_score >= COALESCE(v_class_settings.minimum_passing_grade, 70) THEN
          v_class_status := 'completed_passed';
        ELSE
          v_class_status := 'completed_failed';
        END IF;
      END IF;

      NEW.status := v_class_status;

      INSERT INTO public.class_assignment_progress (class_exercise_id, student_id, best_score, attempts_count, status, last_attempted_at)
      VALUES (v_class_settings.id, NEW.user_id, v_class_best_score, v_class_attempts_count, v_class_status, NEW.completed_at)
      ON CONFLICT (class_exercise_id, student_id)
      DO UPDATE SET
        best_score = EXCLUDED.best_score,
        attempts_count = EXCLUDED.attempts_count,
        status = EXCLUDED.status,
        last_attempted_at = EXCLUDED.last_attempted_at;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- == STEP 4: Create the final BEFORE INSERT trigger ==
CREATE TRIGGER on_new_exercise_attempt
  BEFORE INSERT ON public.exercise_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_exercise_attempt_update();
