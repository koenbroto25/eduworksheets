-- Drop the function to ensure a clean update
DROP FUNCTION IF EXISTS public.get_class_grades_report(uuid);

-- Recreate the function with RLS bypass
CREATE OR REPLACE FUNCTION public.get_class_grades_report(p_class_id uuid)
RETURNS jsonb AS $$
DECLARE
  report jsonb;
  is_teacher boolean;
BEGIN
  -- Temporarily bypass RLS for this function's execution.
  -- This is safe because we perform an explicit authorization check first.
  SET LOCAL astra.bypass_rls = 'on';

  -- Check if the current user is the teacher of the class
  is_teacher := is_class_teacher(auth.uid(), p_class_id);

  IF NOT is_teacher THEN
    RAISE EXCEPTION 'User is not authorized to view this report';
  END IF;

  -- The rest of the function logic remains the same
  WITH students AS (
    SELECT
      u.id AS student_id,
      u.name AS student_name
    FROM public.class_students cs
    JOIN public.users u ON cs.student_id = u.id
    WHERE cs.class_id = p_class_id AND cs.is_active = true
  ),
  exercises AS (
    SELECT
      ce.exercise_id,
      e.title AS exercise_title
    FROM public.class_exercises ce
    JOIN public.exercises e ON ce.exercise_id = e.id
    WHERE ce.class_id = p_class_id
  ),
  grades AS (
    SELECT
      up.user_id AS student_id,
      up.exercise_id,
      up.best_score AS score
    FROM public.user_progress up
    WHERE up.class_id = p_class_id
  )
  SELECT jsonb_build_object(
    'students', (SELECT jsonb_agg(s) FROM students s),
    'exercises', (SELECT jsonb_agg(e) FROM exercises e),
    'grades', (SELECT jsonb_agg(g) FROM grades g)
  ) INTO report;

  RETURN report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution rights again
GRANT EXECUTE ON FUNCTION public.get_class_grades_report(uuid) TO authenticated;
