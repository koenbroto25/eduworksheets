-- Migration: Create RPC for Class Grades Report
-- Date: 2025-07-20
--
-- This migration creates a new RPC function `get_class_grades_report` to provide
-- a secure and efficient way for teachers to fetch grade data for their classes.
-- This function reads from the new `class_assignment_progress` table.

-- Drop the old function if it exists, as CREATE OR REPLACE cannot alter the return type.
DROP FUNCTION IF EXISTS public.get_class_grades_report(uuid);

CREATE OR REPLACE FUNCTION public.get_class_grades_report(p_class_id uuid)
RETURNS TABLE (
    student_id uuid,
    student_name text,
    exercise_id uuid,
    exercise_title text,
    best_score integer,
    attempts_count integer,
    status public.progress_status_enum,
    completed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_teacher_id uuid = auth.uid();
BEGIN
  -- Security Check: Ensure the caller is the teacher of the specified class.
  IF NOT EXISTS (
    SELECT 1
    FROM public.classes
    WHERE id = p_class_id AND teacher_id = v_teacher_id
  ) THEN
    RAISE EXCEPTION 'User is not the teacher of this class or class does not exist.';
  END IF;

  -- Return the report data by joining the necessary tables.
  RETURN QUERY
  SELECT
    cap.student_id,
    u.name AS student_name,
    ce.exercise_id,
    e.title AS exercise_title,
    cap.best_score,
    cap.attempts_count,
    cap.status,
    cap.completed_at
  FROM public.class_assignment_progress cap
  JOIN public.class_exercises ce ON cap.class_exercise_id = ce.id
  JOIN public.exercises e ON ce.exercise_id = e.id
  JOIN public.users u ON cap.student_id = u.id
  WHERE ce.class_id = p_class_id;
END;
$$;

COMMENT ON FUNCTION public.get_class_grades_report(uuid) IS 'Fetches a comprehensive grade report for all students and exercises in a given class. For teacher use only.';
