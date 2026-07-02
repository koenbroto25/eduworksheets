CREATE OR REPLACE FUNCTION get_assigned_class_ids_for_exercise(p_exercise_id UUID)
RETURNS TABLE(class_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ce.class_id
  FROM class_exercises ce
  JOIN classes c ON ce.class_id = c.id
  WHERE ce.exercise_id = p_exercise_id
    AND c.teacher_id = auth.uid();
END;
$$;
