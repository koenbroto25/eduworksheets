CREATE OR REPLACE FUNCTION get_class_student_reports(p_class_id UUID)
RETURNS TABLE(
    student_id UUID,
    student_name TEXT,
    attempts JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- First, check if the caller is the teacher of the class
    IF NOT EXISTS (
        SELECT 1
        FROM classes c
        WHERE c.id = p_class_id AND c.teacher_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'User is not the teacher of this class';
    END IF;

    RETURN QUERY
    SELECT
        cs.student_id,
        u.name AS student_name,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'exercise_id', ea.exercise_id,
                        'exercise_title', e.title,
                        'score', ea.score
                    )
                )
                FROM exercise_attempts ea
                JOIN exercises e ON e.id = ea.exercise_id
                WHERE ea.user_id = cs.student_id AND ea.class_id = p_class_id
            ),
            '[]'::jsonb
        ) AS attempts
    FROM
        class_students cs
    JOIN
        users u ON cs.student_id = u.id
    WHERE
        cs.class_id = p_class_id;
END;
$$;
