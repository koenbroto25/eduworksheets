-- Drop existing policy
DROP POLICY IF EXISTS "Enable read access for class members" ON public.classes;

-- Create a function to check if a user is a member of a class
CREATE OR REPLACE FUNCTION is_class_member(p_class_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.class_students cm
    WHERE cm.class_id = p_class_id AND cm.student_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the policy using the function
CREATE POLICY "Enable read access for class members"
ON public.classes
FOR SELECT
TO authenticated
USING (
  (
    (auth.jwt()->>'user_role') = 'teacher' AND teacher_id = auth.uid()
  ) OR (
    (auth.jwt()->>'user_role') = 'student' AND is_class_member(id, auth.uid())
  )
);
