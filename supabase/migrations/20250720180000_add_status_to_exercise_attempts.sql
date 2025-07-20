-- This migration resolves a "column does not exist" error by adding a 'status'
-- column to the 'exercise_attempts' table.
-- The trigger function 'handle_exercise_attempt_update' implicitly depends on this
-- column to correctly determine and update the student's progress in the
-- 'class_assignment_progress' table.

-- Step 1: Add the 'status' column to the exercise_attempts table.
-- It is nullable as it will be populated by the trigger function upon insertion.
ALTER TABLE public.exercise_attempts
ADD COLUMN status public.progress_status_enum;

COMMENT ON COLUMN public.exercise_attempts.status IS 'The status of this specific attempt (e.g., passed, failed), determined by the trigger.';

-- Step 2: Re-apply the trigger function definition to ensure the database is using the latest version.
-- This is a safety measure to overwrite any potentially stale or incorrect versions of the function.
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
  
  SELECT
    MAX(score),
    COUNT(*)
  INTO
    v_best_score_overall,
    v_total_attempts
  FROM public.exercise_attempts
  WHERE
    user_id = NEW.user_id AND
    exercise_id = NEW.exercise_id;

  v_is_mastered := (v_best_score_overall >= 80);

  INSERT INTO public.user_progress (
    user_id,
    exercise_id,
    best_score_overall,
    attempts_count,
    is_mastered,
    last_attempted_at
  )
  VALUES (
    NEW.user_id,
    NEW.exercise_id,
    v_best_score_overall,
    v_total_attempts,
    v_is_mastered,
    NEW.completed_at
  )
  ON CONFLICT (user_id, exercise_id)
  DO UPDATE SET
    best_score_overall = EXCLUDED.best_score_overall,
    attempts_count = EXCLUDED.attempts_count,
    is_mastered = EXCLUDED.is_mastered,
    last_attempted_at = EXCLUDED.last_attempted_at;

  -- === Part 2: Update Class Assignment Progress (Runs only if attempt is for a class) ===

  IF NEW.class_exercise_id IS NOT NULL THEN
    SELECT *
    INTO v_class_settings
    FROM public.class_exercises ce
    WHERE ce.id = NEW.class_exercise_id
    LIMIT 1;

    IF v_class_settings.id IS NOT NULL THEN
      SELECT
        MAX(score),
        COUNT(*)
      INTO
        v_class_best_score,
        v_class_attempts_count
      FROM public.exercise_attempts
      WHERE
        user_id = NEW.user_id AND
        class_exercise_id = NEW.class_exercise_id;

      IF v_class_settings.due_date IS NOT NULL AND NEW.completed_at > v_class_settings.due_date THEN
        v_class_status := 'completed_late';
      ELSE
        IF v_class_best_score >= COALESCE(v_class_settings.minimum_passing_grade, 70) THEN
          v_class_status := 'completed_passed';
        ELSE
          v_class_status := 'completed_failed';
        END IF;
      END IF;

      -- Update the status of the current attempt row itself
      UPDATE public.exercise_attempts
      SET status = v_class_status
      WHERE id = NEW.id;

      INSERT INTO public.class_assignment_progress (
        class_exercise_id,
        student_id,
        best_score,
        attempts_count,
        status,
        first_attempted_at,
        last_attempted_at,
        completed_at
      )
      VALUES (
        v_class_settings.id,
        NEW.user_id,
        v_class_best_score,
        v_class_attempts_count,
        v_class_status,
        COALESCE(NEW.started_at, NEW.completed_at),
        NEW.completed_at,
        NEW.completed_at
      )
      ON CONFLICT (class_exercise_id, student_id)
      DO UPDATE SET
        best_score = EXCLUDED.best_score,
        attempts_count = EXCLUDED.attempts_count,
        status = EXCLUDED.status,
        last_attempted_at = EXCLUDED.last_attempted_at,
        completed_at = EXCLUDED.completed_at;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
