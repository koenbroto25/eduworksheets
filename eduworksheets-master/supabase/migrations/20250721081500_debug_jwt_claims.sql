-- File: supabase/migrations/20250721081500_debug_jwt_claims.sql
-- This script creates a temporary RPC function to debug the contents of a user's JWT.

-- Step 1: Create the RPC function.
-- It's defined as SECURITY DEFINER so it can access the auth.jwt() function.
CREATE OR REPLACE FUNCTION public.debug_get_jwt_claims()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return the entire JWT payload as a JSONB object.
  RETURN auth.jwt();
END;
$$;

-- Step 2: Grant execute permission to authenticated users so they can call it.
GRANT EXECUTE ON FUNCTION public.debug_get_jwt_claims() TO authenticated;

-- Instructions for use:
-- 1. Run this script in the Supabase SQL Editor.
-- 2. After running, execute the following command in the SQL Editor:
--    SELECT debug_get_jwt_claims();
-- 3. Analyze the JSON output to see the exact claims in the token.
-- 4. (Optional but recommended) Clean up the function after debugging:
--    DROP FUNCTION public.debug_get_jwt_claims();
