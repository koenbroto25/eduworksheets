-- This is the definitive and final migration to fix the student submission workflow.
-- It corrects the schema of the 'user_progress' table and aligns the trigger function perfectly.

-- == STEP 1: Ensure 'user_progress' schema is correct ==
-- The 'last_attempted_at' column was erroneously removed in a previous refactor.
-- This adds it back, which is essential for the trigger logic.
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='user_progress' AND column_name='last_attempted_at') THEN
    ALTER TABLE public.user_progress ADD COLUMN last_attempted_at TIMESTAMPTZ;
  END IF;
END $$;

-- == STEP 2: Clean Slate - Drop old objects to prevent conflicts ==
DROP TRIGGER IF EXISTS on_new_exercise_attempt ON public.exercise_attempts;
DROP FUNCTION IF EXISTS public.handle_exercise_attempt_update();

-- == STEP 3: Create the new, precise trigger function ==
-- This version is simplified and corrected to match the actual, refactored schema.
CREATE OR REPLACE FUNCTION public.handle_exercise_attempt_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  -- Aggregates for user_progress
  v_best_score_overall INT;
  v_total_attempts INT;
  v_is_mastered BOOLEAN;

  -- Aggregates for class_assignment_progress
  v_class_best_score INT;
  v_class_attempts_count INT;
  v_class_status public.progress_status_enum;
  v_class_settings RECORD;
BEGIN
  -- === Part 1: Update Personal User Progress ===
  
  -- Get existing aggregates before this attempt.
  SELECT COALESCE(MAX(score), 0), COALESCE(COUNT(*), 0)
  INTO v_best_score_overall, v_total_attempts
  FROM public.exercise_attempts
  WHERE user_id = NEW.user_id AND exercise_id = NEW.exercise_id;

  -- Include the new attempt in the calculation.
  v_best_score_overall := GREATEST(v_best_score_overall, NEW.score);
  v_total_attempts := v_total_attempts + 1;
  v_is_mastered := (v_best_score_overall >= 80);

  -- Upsert into the personal user_progress table with the corrected column set.
  INSERT INTO public.user_progress (
    user_id, exercise_id, best_score_overall, attempts_count, is_mastered, last_attempted_at
  ) VALUES (
    NEW.user_id, NEW.exercise_id, v_best_score_overall, v_total_attempts, v_is_mastered, NEW.completed_at
  )
  ON CONFLICT (user_id, exercise_id)
  DO UPDATE SET
    best_score_overall = EXCLUDED.best_score_overall,
    attempts_count = EXCLUDED.attempts_count,
    is_mastered = EXCLUDED.is_mastered,
    last_attempted_at = EXCLUDED.last_attempted_at;

  -- === Part 2: Update Class Assignment Progress (if applicable) ===

  IF NEW.class_exercise_id IS NOT NULL THEN
    SELECT * INTO v_class_settings FROM public.class_exercises ce WHERE ce.id = NEW.class_exercise_id LIMIT 1;

    IF v_class_settings.id IS NOT NULL THEN
      -- Calculate aggregates for this specific class assignment.
      SELECT COALESCE(MAX(score), 0), COALESCE(COUNT(*), 0)
      INTO v_class_best_score, v_class_attempts_count
      FROM public.exercise_attempts
      WHERE user_id = NEW.user_id AND class_exercise_id = NEW.class_exercise_id;

      v_class_best_score := GREATEST(v_class_best_score, NEW.score);
      v_class_attempts_count := v_class_attempts_count + 1;

      -- Determine status
      IF v_class_settings.due_date IS NOT NULL AND NEW.completed_at > v_class_settings.due_date THEN
        v_class_status := 'completed_late';
      ELSE
        IF v_class_best_score >= COALESCE(v_class_settings.minimum_passing_grade, 70) THEN
          v_class_status := 'completed_passed';
        ELSE
          v_class_status := 'completed_failed';
        END IF;
      END IF;

      -- Set status on the new row itself
      NEW.status := v_class_status;

      -- Upsert into class_assignment_progress
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

COMMENT ON TRIGGER on_new_exercise_attempt ON public.exercise_attempts IS 'Before an attempt is inserted, it updates all relevant progress tables.';
