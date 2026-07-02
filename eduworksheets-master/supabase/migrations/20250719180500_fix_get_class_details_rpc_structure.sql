-- This migration fixes the get_class_details RPC function to match the expected frontend data structure.
-- It adds the 'student_count' field, which was missing in the previous version, to resolve the
-- "structure of query does not match function result type" error from PostgreSQL.

DROP FUNCTION IF EXISTS get_class_details(UUID);

CREATE OR REPLACE FUNCTION get_class_details(p_class_id UUID)
RETURNS TABLE (
    id uuid,
    name character varying,
    description text,
    teacher_id uuid,
    class_code character varying,
    subject character varying,
    grade_level character varying,
    school_year character varying,
    semester character varying,
    is_archived boolean,
    student_count bigint -- Changed to bigint to match COUNT() result type
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
