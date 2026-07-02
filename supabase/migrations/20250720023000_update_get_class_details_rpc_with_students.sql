-- Drop the existing function to avoid conflicts
DROP FUNCTION IF EXISTS public.get_class_details(uuid);

-- Recreate the function with student profiles included
CREATE OR REPLACE FUNCTION public.get_class_details(p_class_id uuid)
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
  is_active boolean,
  created_at timestamptz,
  students jsonb -- Add a jsonb field to hold student data
) AS $$
BEGIN
  -- This function can be called by any authenticated user,
  -- but RLS on the underlying tables will enforce access control.
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
    c.is_active,
    c.created_at,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email
        )
      )
      FROM public.class_students cs
      JOIN public.users u ON cs.student_id = u.id
      WHERE cs.class_id = c.id AND cs.is_active = true
    ) AS students
  FROM
    public.classes c
  WHERE
    c.id = p_class_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_class_details(uuid) TO authenticated;
