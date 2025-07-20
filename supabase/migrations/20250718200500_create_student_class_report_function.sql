CREATE OR REPLACE FUNCTION get_student_class_report(p_student_id UUID, p_class_id UUID)
RETURNS TABLE (
    total_assignments BIGINT,
    completed_assignments BIGINT,
    average_score NUMERIC,
    last_activity_date TIMESTAMPTZ
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Total assignments for the class
        (SELECT COUNT(*) FROM public.class_exercises ce WHERE ce.class_id = p_class_id) AS total_assignments,
        
        -- Completed assignments by the student in that class
        (SELECT COUNT(*) FROM public.user_progress up WHERE up.user_id = p_student_id AND up.class_id = p_class_id) AS completed_assignments,
        
        -- Average score of the student in that class
        (SELECT AVG(up.best_score) FROM public.user_progress up WHERE up.user_id = p_student_id AND up.class_id = p_class_id) AS average_score,
        
        -- Last activity date of the student in that class
        (SELECT MAX(up.updated_at) FROM public.user_progress up WHERE up.user_id = p_student_id AND up.class_id = p_class_id) AS last_activity_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_student_class_report(UUID, UUID) IS 'Generates a summary report of a student''s participation and performance in a specific class.';
