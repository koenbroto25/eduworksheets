CREATE OR REPLACE FUNCTION get_teacher_class_dashboard(p_class_id UUID)
RETURNS TABLE (
    exercise_id UUID,
    exercise_title TEXT,
    average_score NUMERIC,
    participation_rate NUMERIC,
    total_students BIGINT
)
SECURITY DEFINER
AS $$
DECLARE
    v_total_students BIGINT;
BEGIN
    -- Get the total number of students in the class
    SELECT COUNT(*) INTO v_total_students FROM public.class_students WHERE class_id = p_class_id;

    -- Return the dashboard data
    RETURN QUERY
    SELECT
        ce.exercise_id,
        e.title AS exercise_title,
        AVG(up.best_score) AS average_score,
        -- Calculate participation rate
        CAST(COUNT(up.user_id) AS NUMERIC) / GREATEST(v_total_students, 1) * 100 AS participation_rate,
        v_total_students AS total_students
    FROM
        public.class_exercises ce
    JOIN
        public.exercises e ON ce.exercise_id = e.id
    LEFT JOIN
        public.user_progress up ON ce.exercise_id = up.exercise_id AND ce.class_id = up.class_id
    WHERE
        ce.class_id = p_class_id
    GROUP BY
        ce.exercise_id, e.title;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_teacher_class_dashboard(UUID) IS 'Generates a dashboard for teachers with aggregated performance data for all exercises in a class.';
