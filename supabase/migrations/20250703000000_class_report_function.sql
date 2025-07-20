CREATE OR REPLACE FUNCTION get_class_exercise_averages(class_id UUID)
RETURNS TABLE (exercise_id UUID, average_score NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    exercise_id,
    AVG(score) AS average_score
  FROM
    exercise_attempts
  WHERE
    class_id = get_class_exercise_averages.class_id
  GROUP BY
    exercise_id;
END;
$$ LANGUAGE plpgsql;