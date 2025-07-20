-- This is a consolidated migration to definitively fix the student submission workflow.
-- It ensures all necessary schema changes, policies, and trigger functions are correctly aligned.

-- == PRE-CLEANUP: Drop objects from recent failed attempts to ensure a clean slate ==
DROP TRIGGER IF EXISTS on_new_exercise_attempt ON public.exercise_attempts;
DROP FUNCTION IF EXISTS public.handle_exercise_attempt_update();
DROP POLICY IF EXISTS "Teachers can read student attempts in their classes" ON public.exercise_attempts;

-- == STEP 1: Align the 'exercise_attempts' table schema ==

-- Add 'class_exercise_id' if it doesn't exist.
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='exercise_attempts' AND column_name='class_exercise_id') THEN
    ALTER TABLE public.exercise_attempts ADD COLUMN class_exercise_id UUID REFERENCES public.class_exercises(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Backfill 'class_exercise_id' from 'class_id' if 'class_id' still exists.
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='exercise_attempts' AND column_name='class_id') THEN
    UPDATE public.exercise_attempts ea
    SET class_exercise_id = (
      SELECT ce.id
      FROM public.class_exercises ce
      WHERE ce.class_id = ea.class_id AND ce.exercise_id = ea.exercise_id
    )
    WHERE ea.class_id IS NOT NULL AND ea.class_exercise_id IS NULL;
  END IF;
END $$;

-- Drop 'class_id' if it exists.
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='exercise_attempts' AND column_name='class_id') THEN
    ALTER TABLE public.exercise_attempts DROP COLUMN class_id;
  END IF;
END $$;


-- Add 'status' column if it doesn't exist.
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='exercise_attempts' AND column_name='status') THEN
    ALTER TABLE public.exercise_attempts ADD COLUMN status public.progress_status_enum;
  END IF;
END $$;


-- == STEP 2: Create the definitive 'handle_exercise_attempt_update' trigger function ==

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

  INSERT INTO public.user_progress (user_id, exercise_id, best_score_overall, attempts_count, is_mastered, last_attempted_at)
  VALUES (NEW.user_id, NEW.exercise_id, v_best_score_overall, v_total_attempts, v_is_mastered, NEW.completed_at)
  ON CONFLICT (user_id, exercise_id)
  DO UPDATE SET
    best_score_overall = EXCLUDED.best_score_overall,
    attempts_count = EXCLUDED.attempts_count,
    is_mastered = EXCLUDED.is_mastered,
    last_attempted_at = EXCLUDED.last_attempted_at;

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


-- == STEP 3: Create the BEFORE INSERT trigger ==

CREATE TRIGGER on_new_exercise_attempt
  BEFORE INSERT ON public.exercise_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_exercise_attempt_update();


-- == STEP 4: Recreate the RLS policy ==

CREATE POLICY "Teachers can read student attempts in their classes"
ON public.exercise_attempts
FOR SELECT
TO authenticated
USING (
  (get_user_role() = 'teacher') AND
  EXISTS (
    SELECT 1
    FROM public.class_exercises ce
    JOIN public.classes c ON ce.class_id = c.id
    WHERE ce.id = exercise_attempts.class_exercise_id
      AND c.teacher_id = auth.uid()
  )
);

-- == STEP 5: Ensure the RPC function is correct ==
DROP FUNCTION IF EXISTS public.submit_exercise_attempt(uuid, uuid, uuid, jsonb, integer, integer, integer, timestamptz, timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.submit_exercise_attempt(
  p_user_id uuid,
  p_exercise_id uuid,
  p_class_exercise_id uuid,
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
    user_id, exercise_id, class_exercise_id, answers, score, max_score, time_elapsed,
    is_completed, is_submitted, started_at, completed_at, submitted_at
  ) VALUES (
    p_user_id, p_exercise_id, p_class_exercise_id, p_answers, p_score, p_max_score, p_time_elapsed,
    true, true, p_started_at, p_completed_at, p_submitted_at
  );
END;
$$;
