-- This migration updates the get_class_details RPC function to return a single JSON object.
-- This object includes all class details, the teacher's name, and a nested JSON array of students.
-- This resolves the issue where student names were not being displayed on the class detail page.

DROP FUNCTION IF EXISTS get_class_details(UUID);

CREATE OR REPLACE FUNCTION get_class_details(p_class_id UUID)
RETURNS json AS $$
DECLARE
  class_details json;
BEGIN
  SELECT
    json_build_object(
      'id', c.id,
      'name', c.name,
      'description', c.description,
      'teacher_id', c.teacher_id,
      'class_code', c.class_code,
      'subject', c.subject,
      'grade_level', c.grade_level,
      'school_year', c.school_year,
      'semester', c.semester,
      'is_archived', c.is_archived,
      'teacher_name', u.name,
      'students', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'id', s.id,
            'name', s.name
          )
        ), '[]'::json)
        FROM public.class_students cs
        JOIN public.users s ON cs.student_id = s.id
        WHERE cs.class_id = c.id
      )
    )
  INTO class_details
  FROM
    public.classes c
  JOIN
    public.users u ON c.teacher_id = u.id
  WHERE
    c.id = p_class_id;

  RETURN class_details;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
