CREATE OR REPLACE FUNCTION get_student_classes_rpc(p_student_id UUID)
RETURNS TABLE(class_id UUID, class_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as class_id,
    c.name as class_name
  FROM
    public.class_students cs
  JOIN
    public.classes c ON cs.class_id = c.id
  WHERE
    cs.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql;
