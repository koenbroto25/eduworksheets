-- Drop existing policies for UPDATE and DELETE on exercises table if they exist
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.exercises;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.exercises;

-- Create a new UPDATE policy that allows the creator to update their own exercises.
CREATE POLICY "Enable update for creator"
ON public.exercises
FOR UPDATE
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Create a new DELETE policy that allows the creator to delete their own exercises.
CREATE POLICY "Enable delete for creator"
ON public.exercises
FOR DELETE
USING (auth.uid() = creator_id);

COMMENT ON POLICY "Enable update for creator" ON public.exercises IS 'Ensures that only the user who created the exercise can update it.';
COMMENT ON POLICY "Enable delete for creator" ON public.exercises IS 'Ensures that only the user who created the exercise can delete it.';
