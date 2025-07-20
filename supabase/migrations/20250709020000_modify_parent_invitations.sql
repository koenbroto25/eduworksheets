-- Add child_id column to store the child's user ID upon acceptance
ALTER TABLE public.parent_invitations
ADD COLUMN child_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Make child_email nullable as the invitation is now link-based
ALTER TABLE public.parent_invitations
ALTER COLUMN child_email DROP NOT NULL;

-- Drop existing policies that depend on child_email
DROP POLICY "Users can see their own invitations" ON public.parent_invitations;
DROP POLICY "Users can update their own invitations" ON public.parent_invitations;

-- Recreate policies
-- Parents can see invitations they created.
CREATE POLICY "Parents can see their own invitations"
ON public.parent_invitations FOR SELECT
TO authenticated
USING (auth.uid() = parent_id);

-- Children can see invitations meant for them (once accepted)
-- and anyone can see a pending invitation if they have the link (for the acceptance page)
CREATE POLICY "Users can see specific invitations"
ON public.parent_invitations FOR SELECT
TO authenticated
USING (
  (status = 'pending') OR (auth.uid() = child_id)
);


-- Parents can update the status of their invitations (e.g., revoke)
CREATE POLICY "Parents can update their invitations"
ON public.parent_invitations FOR UPDATE
TO authenticated
USING (auth.uid() = parent_id)
WITH CHECK (auth.uid() = parent_id);

-- Children can update the status to 'accepted'
CREATE POLICY "Children can accept invitations"
ON public.parent_invitations FOR UPDATE
TO authenticated
USING (status = 'pending')
WITH CHECK (auth.uid() = child_id AND status = 'accepted');
