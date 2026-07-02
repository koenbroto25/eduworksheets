CREATE TABLE parent_assignments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    score INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE parent_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage their own assignments"
ON parent_assignments
FOR ALL
USING (auth.uid() = parent_id);

CREATE POLICY "Children can view assignments given to them"
ON parent_assignments
FOR SELECT
USING (auth.uid() = child_id);

CREATE POLICY "Enable read access for authenticated users"
ON public.parent_assignments
FOR SELECT
TO authenticated
USING (true);
