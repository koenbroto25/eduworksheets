-- This migration provides the definitive fix for the get_class_details RPC function.
-- It precisely aligns the data types in the RETURNS TABLE clause with the actual schema of the 'classes' table,
-- resolving the "structure of query does not match function result type" error.

DROP FUNCTION IF EXISTS get_class_details(UUID);

CREATE OR REPLACE FUNCTION get_class_details(p_class_id UUID)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    teacher_id uuid,
    class_code text,
    subject text,
    grade_level text,
    school_year text,
    semester text,
    is_archived boolean,
    student_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.description,
    c.teacher_id,
    c.class_code,
    c.subject,
    c.grade_level,
    c.school_year,
    c.semester,
    c.is_archived,
    (SELECT COUNT(*) FROM public.class_students cs WHERE cs.class_id = c.id) as student_count
  FROM
    public.classes c
  WHERE
    c.id = p_class_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
