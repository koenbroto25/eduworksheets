-- Drop the old, less specific policy on parent_child_link
DROP POLICY IF EXISTS "Parents can view their own links." ON public.parent_child_link;

-- Create a new policy on the users table
-- This policy allows a parent to view the profiles of their linked children
CREATE POLICY "Parents can view their linked children's profiles"
ON public.users FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT child_id
    FROM parent_child_link
    WHERE parent_id = auth.uid()
  )
);

-- Re-create the policy for parents to view their own links, but with a more specific condition
CREATE POLICY "Parents can view their own links."
ON public.parent_child_link FOR SELECT
TO authenticated
USING (
  parent_id = auth.uid()
);
