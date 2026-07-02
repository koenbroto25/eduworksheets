-- This migration fixes the "ambiguous column 'id'" error in the get_my_classes function.
-- The fix is to explicitly qualify the 'id' column with its table name 'public.users.id'.

CREATE OR REPLACE FUNCTION get_my_classes()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  name text,
  description text,
  teacher_id uuid,
  class_code text,
  is_active boolean,
  student_count bigint
)
AS $$
DECLARE
  requesting_user_id uuid := auth.uid();
  requesting_user_role user_role;
BEGIN
  -- Get the role of the user making the request, explicitly referencing users.id
  SELECT role INTO requesting_user_role FROM public.users WHERE public.users.id = requesting_user_id;

  -- Based on the role, return the appropriate classes.
  IF requesting_user_role = 'teacher' THEN
    RETURN QUERY
    SELECT
      c.id,
      c.created_at,
      c.name,
      c.description,
      c.teacher_id,
      c.class_code,
      c.is_active,
      (SELECT count(*) FROM public.class_students cs WHERE cs.class_id = c.id) AS student_count
    FROM
      public.classes c
    WHERE
      c.teacher_id = requesting_user_id
    ORDER BY
      c.created_at DESC;

  ELSIF requesting_user_role = 'student' THEN
    RETURN QUERY
    SELECT
      c.id,
      c.created_at,
      c.name,
      c.description,
      c.teacher_id,
      c.class_code,
      c.is_active,
      (SELECT count(*) FROM public.class_students cs WHERE cs.class_id = c.id) AS student_count
    FROM
      public.classes c
    JOIN
      public.class_students cs ON c.id = cs.class_id
    WHERE
      cs.student_id = requesting_user_id
    ORDER BY
      c.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
