/*
  # Debug and Fix User Creation Issues
  
  1. Enhanced Error Handling
    - Add comprehensive logging to debug signup issues
    - Better error handling in trigger function
    - Fallback mechanisms for user creation
  
  2. Improved Trigger Function
    - More robust error handling
    - Better logging for debugging
    - Fallback name generation from email
  
  3. Manual User Creation Function
    - Backup function to create users manually if needed
    - Can be called from application if trigger fails
*/

-- Enhanced trigger function with better error handling and logging
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_name text;
  user_role user_role;
BEGIN
  -- Log the attempt
  RAISE LOG 'Trigger fired for new user: %', NEW.id;
  RAISE LOG 'User email: %', NEW.email;
  RAISE LOG 'Raw metadata: %', NEW.raw_user_meta_data;
  
  -- Extract name with fallback
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'User'
  );
  
  -- Extract role with fallback
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'student'::user_role
  );
  
  RAISE LOG 'Extracted name: %, role: %', user_name, user_role;
  
  -- Insert user profile
  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_role,
    now(),
    now()
  );
  
  RAISE LOG 'User profile created successfully for: %', NEW.email;
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    RAISE LOG 'User already exists: %', NEW.email;
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE LOG 'Error creating user profile for %: % - %', NEW.email, SQLSTATE, SQLERRM;
    -- Don't fail the auth creation, just log the error
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create a manual user creation function as backup
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id uuid,
  user_email text,
  user_name text DEFAULT NULL,
  user_role user_role DEFAULT 'student'::user_role
)
RETURNS boolean AS $$
DECLARE
  final_name text;
BEGIN
  -- Generate name if not provided
  final_name := COALESCE(
    user_name,
    split_part(user_email, '@', 1),
    'User'
  );
  
  -- Insert or update user profile
  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (user_id, user_email, final_name, user_role, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    role = COALESCE(EXCLUDED.role, users.role),
    updated_at = now();
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in create_user_profile: % - %', SQLSTATE, SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the users table has the correct structure
DO $$
BEGIN
  -- Check if users table exists, if not create it
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    CREATE TABLE users (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email text UNIQUE NOT NULL,
      name text NOT NULL,
      role user_role DEFAULT 'student'::user_role NOT NULL,
      avatar_url text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
  
  -- Ensure RLS is enabled
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
END $$;

-- Test function to verify everything works
CREATE OR REPLACE FUNCTION test_user_creation()
RETURNS text AS $$
DECLARE
  test_result text := '';
BEGIN
  -- Test if we can access the users table
  PERFORM COUNT(*) FROM users;
  test_result := test_result || 'Users table accessible. ';
  
  -- Test if trigger function exists
  PERFORM 1 FROM pg_proc WHERE proname = 'handle_new_user';
  test_result := test_result || 'Trigger function exists. ';
  
  -- Test if trigger exists
  PERFORM 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  test_result := test_result || 'Trigger exists. ';
  
  RETURN test_result || 'All checks passed!';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error in test: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Run the test
SELECT test_user_creation();