-- Helper function to get user role from JWT claims
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN auth.jwt()->>'user_role';
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if a user is a member of a class (SECURITY DEFINER to break recursion)
CREATE OR REPLACE FUNCTION is_class_member(p_class_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.class_members cm
    WHERE cm.class_id = p_class_id AND cm.user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all existing SELECT policies on the classes table to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for class members" ON public.classes;
DROP POLICY IF EXISTS "Students can SELECT classes they are enrolled in" ON public.classes;
DROP POLICY IF EXISTS "Students can read enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can SELECT their own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can read own classes" ON public.classes;


-- Create a single, unified SELECT policy for the classes table
CREATE POLICY "Enable read access for teachers and enrolled students"
ON public.classes
FOR SELECT
TO authenticated
USING (
  (
    get_user_role() = 'teacher' AND teacher_id = auth.uid()
  ) OR (
    get_user_role() = 'student' AND is_class_member(id, auth.uid())
  )
);
