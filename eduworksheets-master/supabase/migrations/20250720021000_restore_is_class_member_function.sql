DROP FUNCTION IF EXISTS public.is_class_member(uuid, uuid);

CREATE OR REPLACE FUNCTION is_class_member(p_user_id uuid, p_class_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.classes
    WHERE id = p_class_id AND teacher_id = p_user_id
  ) OR EXISTS (
    SELECT 1
    FROM public.class_students
    WHERE class_id = p_class_id AND student_id = p_user_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION public.is_class_member(uuid, uuid) TO authenticated;
