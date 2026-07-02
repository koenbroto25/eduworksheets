CREATE OR REPLACE FUNCTION get_teacher_class_exercises(p_class_id uuid)
RETURNS TABLE(
    id uuid,
    exercise_id uuid,
    exercise_title text,
    assigned_at timestamptz,
    due_date timestamptz,
    student_submissions bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_teacher_id uuid;
BEGIN
    -- Get the ID of the currently logged-in user
    v_teacher_id := auth.uid();

    -- Validate that the calling user is the teacher of the specified class
    IF NOT EXISTS (
        SELECT 1
        FROM classes
        WHERE classes.id = p_class_id
          AND classes.teacher_id = v_teacher_id
    ) THEN
        -- If not the legitimate teacher, return an empty table
        RETURN;
    END IF;

    -- Return all exercises for the given class
    RETURN QUERY
    SELECT
        ce.id,
        ce.exercise_id,
        e.title AS exercise_title,
        ce.assigned_at,
        ce.due_date,
        (
            SELECT COUNT(DISTINCT up.user_id)
            FROM user_progress up
            WHERE up.class_id = ce.class_id AND up.exercise_id = ce.exercise_id
        ) AS student_submissions
    FROM
        class_exercises ce
    JOIN
        exercises e ON ce.exercise_id = e.id
    WHERE
        ce.class_id = p_class_id
    ORDER BY
        ce.assigned_at DESC;
END;
$$;
