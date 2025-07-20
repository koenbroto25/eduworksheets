-- This migration corrects the function to check for class membership.
-- It was previously referencing a non-existent table 'class_members' instead of 'class_students'.

-- Recreate the function with the correct table and column names.
CREATE OR REPLACE FUNCTION is_class_member(p_class_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.class_students cs
    WHERE cs.class_id = p_class_id AND cs.student_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
