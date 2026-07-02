-- This migration updates the update_user_progress function to correctly handle
-- the 'status' column in the user_progress table.
-- It fetches the minimum_passing_grade from class_exercises and sets the status
-- to 'completed_passed' or 'completed_failed' accordingly.

CREATE OR REPLACE FUNCTION public.update_user_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_best_score INT;
  v_attempts_count INT;
  v_is_mastered BOOLEAN;
  v_minimum_passing_grade INT;
  v_new_status public.progress_status_enum;
BEGIN
  -- Recalculate aggregates for the user and exercise
  SELECT
    MAX(score),
    COUNT(*)
  INTO
    v_best_score,
    v_attempts_count
  FROM public.exercise_attempts
  WHERE
    user_id = NEW.user_id AND
    exercise_id = NEW.exercise_id;

  -- Determine the status based on the score and minimum passing grade
  -- This logic is now added to correctly populate the 'status' field.
  IF NEW.class_id IS NOT NULL THEN
    SELECT
      ce.minimum_passing_grade
    INTO
      v_minimum_passing_grade
    FROM public.class_exercises ce
    WHERE
      ce.class_id = NEW.class_id AND
      ce.exercise_id = NEW.exercise_id;
  ELSE
    -- If it's not a class exercise, get the grade from the exercise itself
    SELECT
      e.minimum_passing_grade
    INTO
      v_minimum_passing_grade
    FROM public.exercises e
    WHERE
      e.id = NEW.exercise_id;
  END IF;

  -- Default to 70 if no passing grade is set
  IF v_minimum_passing_grade IS NULL THEN
    v_minimum_passing_grade := 70;
  END IF;

  IF NEW.score >= v_minimum_passing_grade THEN
    v_new_status := 'completed_passed';
  ELSE
    v_new_status := 'completed_failed';
  END IF;

  -- For now, is_mastered is simply tied to passing the exercise.
  -- This can be updated with more complex logic later.
  v_is_mastered := (v_best_score >= v_minimum_passing_grade);

  -- Use INSERT ... ON CONFLICT to either create a new progress record or update an existing one.
  INSERT INTO public.user_progress (
    user_id,
    exercise_id,
    class_id,
    best_score,
    attempts_count,
    is_mastered,
    status,
    last_attempted_at
  )
  VALUES (
    NEW.user_id,
    NEW.exercise_id,
    NEW.class_id,
    v_best_score,
    v_attempts_count,
    v_is_mastered,
    v_new_status,
    NEW.completed_at
  )
  ON CONFLICT (user_id, exercise_id, class_id)
  DO UPDATE SET
    best_score = EXCLUDED.best_score,
    attempts_count = EXCLUDED.attempts_count,
    is_mastered = EXCLUDED.is_mastered,
    status = EXCLUDED.status,
    last_attempted_at = EXCLUDED.last_attempted_at;

  RETURN NEW;
END;
$function$;

-- Since we are replacing the function, we don't need to drop/recreate the trigger
-- if it's already pointing to this function name. The trigger will use the new definition.
-- The trigger was created in migration 20250720080500_add_trigger_for_user_progress.sql
