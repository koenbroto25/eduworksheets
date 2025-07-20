CREATE TABLE parent_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    child_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE parent_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can create invitations"
ON parent_invitations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Users can see their own invitations"
ON parent_invitations FOR SELECT
TO authenticated
USING (auth.uid() = parent_id OR child_email = auth.jwt()->>'email');

CREATE POLICY "Users can update their own invitations"
ON parent_invitations FOR UPDATE
TO authenticated
USING (auth.uid() = parent_id OR child_email = auth.jwt()->>'email');
