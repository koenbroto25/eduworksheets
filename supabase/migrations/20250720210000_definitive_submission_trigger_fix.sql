-- This is the definitive migration to fix the student submission workflow.
-- It is based on the exact schema provided and ensures all parts of the submission
-- process are correctly aligned.

-- == STEP 1: Clean Slate - Drop old objects to prevent conflicts ==
DROP TRIGGER IF EXISTS on_new_exercise_attempt ON public.exercise_attempts;
DROP FUNCTION IF EXISTS public.handle_exercise_attempt_update();

-- == STEP 2: Create the new, precise trigger function ==
-- This function is written to match the exact columns from the provided schema.
CREATE OR REPLACE FUNCTION public.handle_exercise_attempt_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  -- Aggregates for user_progress
  v_best_score_overall INT;
  v_best_percentage REAL;
  v_attempts_count INT;
  v_total_time_spent INT;
  v_average_score REAL;
  v_is_completed BOOLEAN;
  v_is_mastered BOOLEAN;
  v_first_attempt_at TIMESTAMPTZ;
  v_completed_at TIMESTAMPTZ;
  v_mastered_at TIMESTAMPTZ;

  -- Aggregates for class_assignment_progress
  v_class_best_score INT;
  v_class_attempts_count INT;
  v_class_status public.progress_status_enum;
  v_class_settings RECORD;
BEGIN
  -- === Part 1: Calculate Aggregates for 'user_progress' ===

  -- Get all attempts for this user/exercise to calculate fresh aggregates
  WITH user_attempts AS (
    SELECT score, percentage, time_elapsed, completed_at, is_completed
    FROM public.exercise_attempts
    WHERE user_id = NEW.user_id AND exercise_id = NEW.exercise_id
  )
  SELECT
    MAX(score),
    MAX(percentage),
    COUNT(*),
    SUM(time_elapsed),
    AVG(score),
    BOOL_OR(is_completed),
    MIN(completed_at), -- First attempt is the earliest completion
    MAX(completed_at)  -- Last attempt is the latest completion
  INTO
    v_best_score_overall,
    v_best_percentage,
    v_attempts_count,
    v_total_time_spent,
    v_average_score,
    v_is_completed,
    v_first_attempt_at,
    v_completed_at
  FROM user_attempts;

  -- Include the new attempt in the calculations
  v_best_score_overall := GREATEST(v_best_score_overall, NEW.score);
  v_best_percentage := GREATEST(v_best_percentage, NEW.percentage);
  v_attempts_count := v_attempts_count + 1;
  v_total_time_spent := v_total_time_spent + NEW.time_elapsed;
  -- Recalculate average score with the new attempt
  v_average_score := ((v_average_score * (v_attempts_count - 1)) + NEW.score) / v_attempts_count;
  v_is_completed := v_is_completed OR NEW.is_completed;
  v_is_mastered := (v_best_score_overall >= 80); -- Or your specific mastery logic

  -- Set mastered_at timestamp if mastery is newly achieved
  IF v_is_mastered AND (SELECT NOT is_mastered FROM user_progress WHERE user_id = NEW.user_id AND exercise_id = NEW.exercise_id) THEN
    v_mastered_at := NEW.completed_at;
  ELSE
    v_mastered_at := (SELECT mastered_at FROM user_progress WHERE user_id = NEW.user_id AND exercise_id = NEW.exercise_id);
  END IF;


  -- === Part 2: Upsert into 'user_progress' with all columns ===

  INSERT INTO public.user_progress (
    user_id, exercise_id, best_score_overall, best_percentage, attempts_count,
    total_time_spent, average_score, is_completed, is_mastered, first_attempt_at,
    last_attempt_at, completed_at, mastered_at
  ) VALUES (
    NEW.user_id, NEW.exercise_id, v_best_score_overall, v_best_percentage, v_attempts_count,
    v_total_time_spent, v_average_score, v_is_completed, v_is_mastered, v_first_attempt_at,
    NEW.completed_at, -- last_attempted_at is always the current one
    v_completed_at, v_mastered_at
  )
  ON CONFLICT (user_id, exercise_id)
  DO UPDATE SET
    best_score_overall = EXCLUDED.best_score_overall,
    best_percentage = EXCLUDED.best_percentage,
    attempts_count = EXCLUDED.attempts_count,
    total_time_spent = EXCLUDED.total_time_spent,
    average_score = EXCLUDED.average_score,
    is_completed = EXCLUDED.is_completed,
    is_mastered = EXCLUDED.is_mastered,
    last_attempted_at = EXCLUDED.last_attempted_at,
    completed_at = EXCLUDED.completed_at,
    mastered_at = EXCLUDED.mastered_at;


  -- === Part 3: Update Class Assignment Progress (if applicable) ===

  IF NEW.class_exercise_id IS NOT NULL THEN
    SELECT * INTO v_class_settings FROM public.class_exercises ce WHERE ce.id = NEW.class_exercise_id LIMIT 1;

    IF v_class_settings.id IS NOT NULL THEN
      -- Calculate aggregates for this specific class assignment
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
      INSERT INTO public.class_assignment_progress (class_exercise_id, student_id, best_score, attempts_count, status, first_attempted_at, last_attempted_at, completed_at)
      VALUES (v_class_settings.id, NEW.user_id, v_class_best_score, v_class_attempts_count, v_class_status, COALESCE(NEW.started_at, NEW.completed_at), NEW.completed_at, NEW.completed_at)
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


-- == STEP 3: Create the final BEFORE INSERT trigger ==

CREATE TRIGGER on_new_exercise_attempt
  BEFORE INSERT ON public.exercise_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_exercise_attempt_update();

COMMENT ON TRIGGER on_new_exercise_attempt ON public.exercise_attempts IS 'Before an attempt is inserted, calculates and sets its status, and updates all relevant progress tables.';
