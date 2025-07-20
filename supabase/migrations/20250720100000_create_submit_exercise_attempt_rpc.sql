-- This migration creates a new RPC function to handle exercise attempt submissions.
-- This provides a safe and controlled way to insert data into exercise_attempts,
-- preventing frontend clients from trying to insert into generated columns like 'percentage'.

CREATE OR REPLACE FUNCTION public.submit_exercise_attempt(
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
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.exercise_attempts (
    user_id,
    exercise_id,
    class_id,
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
    p_class_id,
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
