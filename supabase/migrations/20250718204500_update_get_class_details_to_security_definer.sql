-- This migration updates the get_class_details function to run with the permissions
-- of the function owner (SECURITY DEFINER). This is crucial for bypassing the calling
-- user's RLS policies, which can prevent the function from finding the class and
-- cause the frontend to receive zero rows, triggering a ".single()" error.

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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
