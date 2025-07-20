-- This migration fixes the submit_exercise_attempt RPC function to align with the
-- refactored progress tracking schema.
-- It replaces the outdated 'p_class_id' parameter with 'p_class_exercise_id'
-- and correctly inserts into the 'class_exercise_id' column of the 'exercise_attempts' table.

-- First, drop the existing function to be able to change its signature.
DROP FUNCTION IF EXISTS public.submit_exercise_attempt(
  p_user_id uuid,
  p_exercise_id uuid,
  p_class_id uuid,
  p_answers jsonb,
  p_score integer,
  p_max_score integer,
  p_time_elapsed integer,
  p_started_at timestamptz,
  p_completed_at timestamptz,
  p_submitted_at timestamptz
);

-- Recreate the function with the correct parameter and logic.
CREATE OR REPLACE FUNCTION public.submit_exercise_attempt(
  p_user_id uuid,
  p_exercise_id uuid,
  p_class_exercise_id uuid, -- Correct parameter
  p_answers jsonb,
  p_score integer,
  p_max_score integer,
  p_time_elapsed integer,
  p_started_at timestamptz,
  p_completed_at timestamptz,
  p_submitted_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.exercise_attempts (
    user_id,
    exercise_id,
    class_exercise_id, -- Correct column
    answers,
    score,
    max_score,
    time_elapsed,
    is_completed,
    is_submitted,
    started_at,
    completed_at,
    submitted_at
  )
  VALUES (
    p_user_id,
    p_exercise_id,
    p_class_exercise_id, -- Correct value
    p_answers,
    p_score,
    p_max_score,
    p_time_elapsed,
    true, -- is_completed is always true on submission
    true, -- is_submitted is always true on submission
    p_started_at,
    p_completed_at,
    p_submitted_at
  );
END;
$$;

-- Also, the trigger function needs to be corrected.
-- The previous refactoring migration had a flaw. It used NEW.class_id which does not exist.
-- It should use NEW.class_exercise_id to find the class_id.
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
  v_class_id uuid;
  v_class_best_score INT;
  v_class_attempts_count INT;
  v_class_status public.progress_status_enum;
  v_class_settings RECORD;
BEGIN
  -- === Part 1: Update Personal User Progress (Always runs) ===
  
  -- Recalculate overall aggregates for the user and exercise.
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

  -- For now, mastery is simply achieving a score of 80 or higher.
  v_is_mastered := (v_best_score_overall >= 80);

  -- Upsert into the personal user_progress table.
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
    -- Find the corresponding class_exercises record.
    SELECT *
    INTO v_class_settings
    FROM public.class_exercises ce
    WHERE ce.id = NEW.class_exercise_id
    LIMIT 1;

    -- Proceed only if a valid class assignment is found.
    IF v_class_settings.id IS NOT NULL THEN
      -- Recalculate aggregates for this specific class assignment.
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

      -- Determine the status based on class settings.
      IF v_class_settings.due_date IS NOT NULL AND NEW.completed_at > v_class_settings.due_date THEN
        v_class_status := 'completed_late';
      ELSE
        IF v_class_best_score >= COALESCE(v_class_settings.minimum_passing_grade, 70) THEN
          v_class_status := 'completed_passed';
        ELSE
          v_class_status := 'completed_failed';
        END IF;
      END IF;

      -- Upsert into the class_assignment_progress table.
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
        COALESCE(NEW.started_at, NEW.completed_at), -- Use started_at if available
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

-- Drop the old trigger and recreate it to point to the corrected function
DROP TRIGGER IF EXISTS on_new_exercise_attempt ON public.exercise_attempts;

CREATE TRIGGER on_new_exercise_attempt
  AFTER INSERT ON public.exercise_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_exercise_attempt_update();

COMMENT ON TRIGGER on_new_exercise_attempt ON public.exercise_attempts IS 'After an exercise attempt is inserted, updates both personal and class-specific progress tables.';
