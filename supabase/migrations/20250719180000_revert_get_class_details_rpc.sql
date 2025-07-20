-- This migration reverts the get_class_details RPC function to a simpler, more robust version.
-- It removes the complex JOINs to the users table to avoid RLS conflicts, which was the
-- root cause of the "JSON object requested, multiple (or no) rows returned" error.
-- The frontend logic will be updated separately to fetch teacher and student data in separate calls.

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
    is_archived boolean
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
    c.is_archived
  FROM
    public.classes c
  WHERE
    c.id = p_class_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
