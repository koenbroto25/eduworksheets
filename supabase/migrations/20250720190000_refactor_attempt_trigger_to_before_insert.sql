-- This migration refactors the exercise attempt trigger to be a BEFORE INSERT trigger.
-- This is a more efficient and robust way to set the 'status' of the new row,
-- as it modifies the row before it's written to disk, avoiding a separate UPDATE statement
-- and resolving a persistent "column does not exist" error.

-- Step 1: Drop the existing AFTER INSERT trigger.
DROP TRIGGER IF EXISTS on_new_exercise_attempt ON public.exercise_attempts;

-- Step 2: Redefine the trigger function to work as a BEFORE trigger.
-- Key changes:
-- - It now calculates aggregates and then includes the NEW record's data.
-- - It modifies the NEW record directly with `NEW.status := ...` instead of using UPDATE.
-- - It always returns NEW at the end, which is required for BEFORE triggers.
CREATE OR REPLACE FUNCTION public.handle_exercise_attempt_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  -- Personal progress variables
  v_best_score_overall INT;
  v_total_attempts INT;
  v_is_mastered BOOLEAN;

  -- Class assignment progress variables
  v_class_best_score INT;
  v_class_attempts_count INT;
  v_class_status public.progress_status_enum;
  v_class_settings RECORD;
BEGIN
  -- === Part 1: Update Personal User Progress (Always runs) ===
  
  -- Get existing aggregates before this attempt.
  SELECT
    COALESCE(MAX(score), 0),
    COALESCE(COUNT(*), 0)
  INTO
    v_best_score_overall,
    v_total_attempts
  FROM public.exercise_attempts
  WHERE
    user_id = NEW.user_id AND
    exercise_id = NEW.exercise_id;

  -- Include the new attempt in the calculation.
  v_best_score_overall := GREATEST(v_best_score_overall, NEW.score);
  v_total_attempts := v_total_attempts + 1;
  v_is_mastered := (v_best_score_overall >= 80);

  -- Upsert into the personal user_progress table.
  INSERT INTO public.user_progress (
    user_id, exercise_id, best_score_overall, attempts_count, is_mastered, last_attempted_at
  ) VALUES (
    NEW.user_id, NEW.exercise_id, v_best_score_overall, v_total_attempts, v_is_mastered, NEW.completed_at
  ) ON CONFLICT (user_id, exercise_id)
  DO UPDATE SET
    best_score_overall = EXCLUDED.best_score_overall,
    attempts_count = EXCLUDED.attempts_count,
    is_mastered = EXCLUDED.is_mastered,
    last_attempted_at = EXCLUDED.last_attempted_at;

  -- === Part 2: Update Class Assignment Progress (Runs only if attempt is for a class) ===

  IF NEW.class_exercise_id IS NOT NULL THEN
    SELECT * INTO v_class_settings FROM public.class_exercises ce WHERE ce.id = NEW.class_exercise_id LIMIT 1;

    IF v_class_settings.id IS NOT NULL THEN
      -- Get existing aggregates for this specific class assignment.
      SELECT
        COALESCE(MAX(score), 0),
        COALESCE(COUNT(*), 0)
      INTO
        v_class_best_score,
        v_class_attempts_count
      FROM public.exercise_attempts
      WHERE
        user_id = NEW.user_id AND
        class_exercise_id = NEW.class_exercise_id;

      -- Include the new attempt in the calculation.
      v_class_best_score := GREATEST(v_class_best_score, NEW.score);
      v_class_attempts_count := v_class_attempts_count + 1;

      -- Determine the status.
      IF v_class_settings.due_date IS NOT NULL AND NEW.completed_at > v_class_settings.due_date THEN
        v_class_status := 'completed_late';
      ELSE
        IF v_class_best_score >= COALESCE(v_class_settings.minimum_passing_grade, 70) THEN
          v_class_status := 'completed_passed';
        ELSE
          v_class_status := 'completed_failed';
        END IF;
      END IF;

      -- Directly modify the NEW record before it is inserted.
      NEW.status := v_class_status;

      -- Upsert into the class_assignment_progress table.
      INSERT INTO public.class_assignment_progress (
        class_exercise_id, student_id, best_score, attempts_count, status, first_attempted_at, last_attempted_at, completed_at
      ) VALUES (
        v_class_settings.id, NEW.user_id, v_class_best_score, v_class_attempts_count, v_class_status,
        COALESCE(NEW.started_at, NEW.completed_at), NEW.completed_at, NEW.completed_at
      ) ON CONFLICT (class_exercise_id, student_id)
      DO UPDATE SET
        best_score = EXCLUDED.best_score,
        attempts_count = EXCLUDED.attempts_count,
        status = EXCLUDED.status,
        last_attempted_at = EXCLUDED.last_attempted_at,
        completed_at = EXCLUDED.completed_at;
    END IF;
  END IF;

  -- Return the (potentially modified) NEW record to be inserted.
  RETURN NEW;
END;
$function$;

-- Step 3: Create the new BEFORE INSERT trigger.
CREATE TRIGGER on_new_exercise_attempt
  BEFORE INSERT ON public.exercise_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_exercise_attempt_update();

COMMENT ON TRIGGER on_new_exercise_attempt ON public.exercise_attempts IS 'Before an exercise attempt is inserted, calculates and sets its status, and updates progress tables.';
