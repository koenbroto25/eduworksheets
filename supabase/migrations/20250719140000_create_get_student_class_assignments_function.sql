CREATE OR REPLACE FUNCTION get_student_class_assignments(p_class_id uuid)
RETURNS TABLE(
    id uuid,
    exercise_id uuid,
    exercise_title text,
    assigned_at timestamptz,
    due_date timestamptz,
    status text,
    score int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id uuid;
BEGIN
    v_student_id := auth.uid();

    -- Validate that the calling user is a member of the specified class
    IF NOT EXISTS (
        SELECT 1
        FROM class_students
        WHERE class_students.class_id = p_class_id
          AND class_students.student_id = v_student_id
    ) THEN
        RAISE EXCEPTION 'User is not a member of this class';
    END IF;

    -- Return all exercises for the given class with student-specific progress
    RETURN QUERY
    SELECT
        ce.id,
        ce.exercise_id,
        e.title AS exercise_title,
        ce.assigned_at,
        ce.due_date,
        COALESCE(up.status, 'not-started')::text AS status,
        up.best_score AS score
    FROM
        class_exercises ce
    JOIN
        exercises e ON ce.exercise_id = e.id
    LEFT JOIN
        user_progress up ON ce.exercise_id = up.exercise_id
                         AND ce.class_id = up.class_id
                         AND up.user_id = v_student_id
    WHERE
        ce.class_id = p_class_id
    ORDER BY
        ce.assigned_at DESC;
END;
$$;
