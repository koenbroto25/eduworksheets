/*
  # Create exercises table

  1. New Tables
    - `exercises`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `subject` (text)
      - `grade` (text)
      - `material` (text, optional)
      - `difficulty` (enum: easy, medium, hard)
      - `is_public` (boolean)
      - `creator_id` (uuid, references users)
      - `tags` (text array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `exercises` table
    - Add policies for CRUD operations based on ownership and public access
*/

-- Create enum for difficulty levels
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  subject text NOT NULL,
  grade text NOT NULL,
  material text,
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  is_public boolean NOT NULL DEFAULT false,
  creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read public exercises"
  ON exercises
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can read own exercises"
  ON exercises
  FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Users can create exercises"
  ON exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own exercises"
  ON exercises
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can delete own exercises"
  ON exercises
  FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

-- Create function to handle exercise updates
CREATE OR REPLACE FUNCTION handle_exercise_update()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for exercise updates
DROP TRIGGER IF EXISTS on_exercise_updated ON exercises;
CREATE TRIGGER on_exercise_updated
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION handle_exercise_update();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exercises_creator_id ON exercises(creator_id);
CREATE INDEX IF NOT EXISTS idx_exercises_subject ON exercises(subject);
CREATE INDEX IF NOT EXISTS idx_exercises_grade ON exercises(grade);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_is_public ON exercises(is_public);
CREATE INDEX IF NOT EXISTS idx_exercises_created_at ON exercises(created_at DESC);