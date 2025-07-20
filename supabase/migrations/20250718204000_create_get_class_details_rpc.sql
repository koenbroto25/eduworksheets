-- This migration creates a new RPC function to safely fetch the details
-- for a single class, including the teacher's name and the student count.
-- This avoids the "multiple (or no) rows returned" error on the frontend
-- by ensuring a single JSON object is returned.

CREATE OR REPLACE FUNCTION get_class_details(p_class_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  teacher_id UUID,
  class_code TEXT,
  subject TEXT,
  grade_level TEXT,
  school_year TEXT,
  semester TEXT,
  is_archived BOOLEAN,
  teacher_name TEXT,
  student_count BIGINT
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
    u.name AS teacher_name,
    (SELECT COUNT(*) FROM public.class_students cs WHERE cs.class_id = c.id) AS student_count
  FROM
    public.classes c
  JOIN
    public.users u ON c.teacher_id = u.id
  WHERE
    c.id = p_class_id;
END;
$$ LANGUAGE plpgsql STABLE;
