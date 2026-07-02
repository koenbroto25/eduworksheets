-- File: supabase/migrations/20250721080000_fix_user_auth_role.sql
-- This script addresses a persistent RLS issue where the user's JWT
-- does not contain the correct 'role' claim, even if the 'public.users' table is correct.
-- This is likely because the role was set in user_metadata instead of app_metadata on sign-up.

-- Step 1: Create a temporary, secure function to update app_metadata.
-- This function runs with the privileges of the definer (the superuser),
-- allowing it to modify the protected auth.users table.
CREATE OR REPLACE FUNCTION public.set_user_app_metadata_role(
    user_id uuid,
    new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', new_role)
  WHERE id = user_id;
END;
$$;

-- Step 2: Execute the function for the specific user who is experiencing the issue.
-- Replace 'f2c304e6-60b7-4160-8394-4f8ef2706fbc' with the actual user ID if it's different.
SELECT public.set_user_app_metadata_role('f2c304e6-60b7-4160-8394-4f8ef2706fbc', 'teacher');

-- Step 3: (Optional but recommended) Clean up the temporary function after use.
-- You can run this command after confirming the fix works.
-- DROP FUNCTION public.set_user_app_metadata_role(uuid, text);

-- After running this script, the user MUST sign out and sign back in
-- to get a new JWT with the updated 'role' claim.
