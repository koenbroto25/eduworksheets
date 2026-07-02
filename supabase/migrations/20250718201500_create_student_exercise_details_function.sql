CREATE OR REPLACE FUNCTION get_student_exercise_details(p_student_id UUID, p_class_exercise_id UUID)
RETURNS TABLE (
    attempt_id UUID,
    score INT,
    submitted_at TIMESTAMPTZ,
    answers JSONB
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ea.id AS attempt_id,
        ea.score,
        ea.submitted_at,
        ea.answers
    FROM
        public.exercise_attempts ea
    JOIN
        public.class_exercises ce ON ea.class_id = ce.class_id AND ea.exercise_id = ce.exercise_id
    WHERE
        ea.user_id = p_student_id AND
        ce.id = p_class_exercise_id
    ORDER BY
        ea.submitted_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_student_exercise_details(UUID, UUID) IS 'Retrieves the complete history of all attempts for a specific student on a specific class exercise.';
