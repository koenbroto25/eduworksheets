-- This script ensures that public exercises and their questions are accessible to everyone, including unauthenticated users.

-- 1. Drop existing policies to avoid conflicts.
DROP POLICY IF EXISTS "Public exercises are viewable by everyone." ON public.exercises;
DROP POLICY IF EXISTS "Public questions are viewable by everyone." ON public.questions;

-- 2. Create a policy to allow public read access to exercises marked as public.
-- This allows anyone (logged in or not) to select exercises where `is_public` is true.
CREATE POLICY "Public exercises are viewable by everyone."
ON public.exercises FOR SELECT
TO anon, authenticated
USING (is_public = true);

-- 3. Create a policy to allow public read access to questions of public exercises.
-- This allows anyone to select questions if they belong to an exercise that is public.
CREATE POLICY "Public questions are viewable by everyone."
ON public.questions FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.exercises
    WHERE exercises.id = questions.exercise_id AND exercises.is_public = true
  )
);

-- 4. Ensure RLS is enabled on the tables. If it's already enabled, this command does nothing.
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- 5. Grant necessary permissions to the 'anon' role.
-- This ensures the anonymous role can read the data as allowed by the RLS policies above.
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON TABLE public.exercises TO anon;
GRANT SELECT ON TABLE public.questions TO anon;
GRANT SELECT ON TABLE public.users TO anon; -- Required for fetching creator info, RLS on users table will still apply.

-- Note: You might already have a policy on the `users` table. 
-- The `GRANT SELECT` on `users` is needed for the query to attempt the join.
-- The application code now handles cases where the creator's name is null, so even if RLS on `users` blocks the fetch, the app won't crash.
