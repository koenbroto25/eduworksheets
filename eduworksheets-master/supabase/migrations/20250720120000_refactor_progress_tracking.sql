-- Migration: Refactor Progress Tracking
-- Date: 2025-07-20
--
-- This migration fundamentally refactors how student progress is tracked to resolve
-- architectural conflicts and support distinct progress types:
-- 1. Personal Progress: A student's overall mastery of an exercise, regardless of context.
-- 2. Class Assignment Progress: A student's performance on a specific class assignment,
--    tied to teacher-defined settings (due dates, passing grades).
--
-- Changes:
-- 1. Creates a new table `class_assignment_progress` for detailed class-specific reporting.
-- 2. Alters the existing `user_progress` table to be purely for personal progress tracking.
-- 3. Replaces the old `update_user_progress` trigger function with a new, more robust
--    `handle_exercise_attempt_update` function that updates both tables.

-- Step 1: Create the new table for class-specific assignment progress.
-- This table will be the primary source for teacher-facing grade reports.
CREATE TABLE public.class_assignment_progress (
    class_exercise_id uuid NOT NULL,
    student_id uuid NOT NULL,
    best_score integer,
    attempts_count integer NOT NULL DEFAULT 0,
    status public.progress_status_enum NOT NULL DEFAULT 'not_started',
    first_attempted_at timestamptz,
    last_attempted_at timestamptz,
    completed_at timestamptz,
    CONSTRAINT class_assignment_progress_pkey PRIMARY KEY (class_exercise_id, student_id),
    CONSTRAINT fk_class_exercise FOREIGN KEY (class_exercise_id) REFERENCES public.class_exercises(id) ON DELETE CASCADE,
    CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.class_assignment_progress IS 'Tracks student progress for a specific exercise assigned to a class, including status against teacher settings.';

-- Add indexes for efficient querying by teachers and students.
CREATE INDEX idx_class_assignment_progress_student ON public.class_assignment_progress(student_id);
CREATE INDEX idx_class_assignment_progress_class_exercise ON public.class_assignment_progress(class_exercise_id);


-- Step 2: Alter the existing user_progress table to be purely for personal progress.
-- This simplifies its purpose and resolves the core issue of the previous bug.

-- First, drop any RLS policies that depend on the columns we are about to remove.
DROP POLICY IF EXISTS "Teachers can read student progress in their classes" ON public.user_progress;
-- Add other policies here if they also cause dependency errors.

-- Now, alter the table structure.
ALTER TABLE public.user_progress
  DROP COLUMN IF EXISTS class_id,
  DROP COLUMN IF EXISTS status;

ALTER TABLE public.user_progress
  RENAME COLUMN best_score TO best_score_overall;

COMMENT ON TABLE public.user_progress IS 'Tracks a user''s overall, personal progress and mastery on an exercise, aggregated across all attempts (class-based or personal).';
COMMENT ON COLUMN public.user_progress.best_score_overall IS 'The best score achieved by the user for this exercise across all attempts.';


-- Step 3: Drop the old trigger and function in the correct order.
-- First, drop the trigger that depends on the function.
DROP TRIGGER IF EXISTS on_exercise_attempt_change ON public.exercise_attempts;
-- Now it is safe to drop the function itself.
DROP FUNCTION IF EXISTS public.update_user_progress();


-- Step 4: Create the new, comprehensive trigger function.
-- This function acts as a central handler for any new exercise attempt.
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
  -- This can be made more complex later if needed.
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

  IF NEW.class_id IS NOT NULL THEN
    -- Find the corresponding class_exercises record.
    SELECT *
    INTO v_class_settings
    FROM public.class_exercises ce
    WHERE ce.class_id = NEW.class_id AND ce.exercise_id = NEW.exercise_id
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
        exercise_id = NEW.exercise_id AND
        class_id = NEW.class_id;

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

-- Step 5: Create the new trigger on exercise_attempts to call the new function.
CREATE TRIGGER on_new_exercise_attempt
  AFTER INSERT ON public.exercise_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_exercise_attempt_update();

COMMENT ON TRIGGER on_new_exercise_attempt ON public.exercise_attempts IS 'After an exercise attempt is inserted, updates both personal and class-specific progress tables.';
