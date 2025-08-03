-- Drop the old, outdated function first to avoid conflicts.
DROP FUNCTION IF EXISTS get_student_class_report(UUID, UUID);

-- Create the new, correct function that aligns with the refactored progress tracking system.
CREATE OR REPLACE FUNCTION get_student_class_report(p_student_id UUID, p_class_id UUID)
RETURNS TABLE (
    class_name TEXT,
    total_assignments_completed BIGINT,
    average_score NUMERIC,
    total_time_spent BIGINT, -- in seconds
    assignments JSONB
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH student_progress AS (
        SELECT
            cap.class_exercise_id,
            cap.best_score,
            cap.attempts_count,
            cap.status,
            -- Approximate time spent by summing up all attempts for that assignment
            (SELECT SUM(ea.time_elapsed) FROM public.exercise_attempts ea WHERE ea.user_id = p_student_id AND ea.class_exercise_id = cap.class_exercise_id) as time_spent
        FROM
            public.class_assignment_progress cap
        WHERE
            cap.student_id = p_student_id
            AND cap.class_exercise_id IN (SELECT ce.id FROM public.class_exercises ce WHERE ce.class_id = p_class_id)
    )
    SELECT
        (SELECT c.name FROM public.classes c WHERE c.id = p_class_id) as class_name,
        (SELECT COUNT(*) FROM student_progress WHERE status LIKE 'completed%') as total_assignments_completed,
        (SELECT AVG(sp.best_score) FROM student_progress sp WHERE sp.best_score IS NOT NULL) as average_score,
        (SELECT SUM(sp.time_spent) FROM student_progress sp)::BIGINT as total_time_spent,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'exercise_title', ex.title,
                    'best_score', sp.best_score,
                    'attempts_count', sp.attempts_count,
                    'status', sp.status
                )
            )
            FROM public.class_exercises ce
            JOIN public.exercises ex ON ce.exercise_id = ex.id
            LEFT JOIN student_progress sp ON ce.id = sp.class_exercise_id
            WHERE ce.class_id = p_class_id
        ) as assignments;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_student_class_report(UUID, UUID) IS 'Generates a detailed report of a student''s performance in a specific class, using the new class_assignment_progress table.';
