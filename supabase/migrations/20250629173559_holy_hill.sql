-- Debug and fix user creation issues
-- This migration ensures the user creation trigger works properly

-- First, let's check if the trigger function exists and recreate it
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Add logging to help debug
  RAISE LOG 'Creating user profile for user ID: %', NEW.id;
  RAISE LOG 'User email: %', NEW.email;
  RAISE LOG 'User metadata: %', NEW.raw_user_meta_data;
  
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role)
  );
  
  RAISE LOG 'User profile created successfully for: %', NEW.email;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating user profile: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure the users table exists with correct structure
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    role user_role DEFAULT 'student'::user_role NOT NULL,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Recreate policies to ensure they work
DROP POLICY IF EXISTS "Public read access to basic user info" ON users;
CREATE POLICY "Public read access to basic user info"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Test the function manually (this will help us see if there are any issues)
-- You can run this in SQL editor to test:
-- SELECT handle_new_user() FROM auth.users LIMIT 1;