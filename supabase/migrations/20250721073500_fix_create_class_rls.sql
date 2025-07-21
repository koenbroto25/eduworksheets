-- Step 1: Create or replace the helper function to get the user's role from the JWT.
-- This function is the source of truth for the user's authenticated role.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN auth.jwt()->>'role';
END;
$$;

-- Step 2: Drop the old, problematic policy that relied on a subquery to the users table.
DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;

-- Step 3: Create the new, more reliable policy for inserting classes.
-- This policy uses the get_user_role() helper function to check the role directly from the JWT,
-- avoiding transaction visibility issues.
CREATE POLICY "Teachers can create classes"
ON public.classes FOR INSERT
TO authenticated
WITH CHECK (
  (public.get_user_role() = 'teacher') AND (teacher_id = auth.uid())
);

-- Grant execute permission on the function to the authenticated role
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
