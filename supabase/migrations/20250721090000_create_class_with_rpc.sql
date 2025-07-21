-- File: supabase/migrations/20250721090000_create_class_with_rpc.sql
-- This migration implements the final, definitive solution based on the proven pattern
-- from 'study_case_class_detail_rls_fix.md' to resolve the RLS recursion error.
-- The solution is to move the class creation logic into a SECURITY DEFINER RPC function.

-- Step 1: Drop the problematic INSERT policy from the 'classes' table.
-- We will no longer allow direct inserts. All creations will go through the RPC.
DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;

-- Step 2: Create the is_teacher helper function if it doesn't exist.
-- This function is safe because of SECURITY DEFINER and search_path.
CREATE OR REPLACE FUNCTION public.is_teacher(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = p_user_id AND role = 'teacher'
  );
END;
$$;

-- Step 3: Create the RPC function for creating a class.
-- This function acts as a secure gateway for the INSERT operation.
CREATE OR REPLACE FUNCTION public.create_class_rpc(
  class_name text,
  class_description text
)
RETURNS uuid -- Return the new class ID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_class_id uuid;
  class_code text;
BEGIN
  -- First, verify the user is a teacher. This check bypasses RLS on users table.
  IF NOT public.is_teacher(auth.uid()) THEN
    RAISE EXCEPTION 'Only teachers can create classes.';
  END IF;

  -- Generate a unique class code
  class_code := substr(md5(random()::text), 0, 7);

  -- Insert the new class and return its ID
  INSERT INTO public.classes (name, description, teacher_id, class_code)
  VALUES (class_name, class_description, auth.uid(), class_code)
  RETURNING id INTO new_class_id;

  RETURN new_class_id;
END;
$$;

-- Step 4: Grant execute permissions.
GRANT EXECUTE ON FUNCTION public.is_teacher(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_class_rpc(text, text) TO authenticated;
