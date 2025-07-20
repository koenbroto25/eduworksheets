/*
  # Create exercise_attempts table

  1. New Tables
    - `exercise_attempts`
      - `id` (uuid, primary key)
      - `exercise_id` (uuid, references exercises)
      - `user_id` (uuid, references users)
      - `class_id` (uuid, references classes, optional)
      - `answers` (jsonb)
      - `score` (integer)
      - `max_score` (integer)
      - `time_elapsed` (integer, in seconds)
      - `is_completed` (boolean)
      - `started_at` (timestamp)
      - `completed_at` (timestamp, optional)

  2. Security
    - Enable RLS on `exercise_attempts` table
    - Add policies for users to manage their own attempts
    - Add policies for teachers to view student attempts in their classes
*/

-- Create exercise_attempts table
CREATE TABLE IF NOT EXISTS exercise_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  answers jsonb NOT NULL DEFAULT '[]',
  score integer NOT NULL DEFAULT 0,
  max_score integer NOT NULL DEFAULT 0,
  time_elapsed integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE exercise_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own attempts"
  ON exercise_attempts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Teachers can read student attempts in their classes"
  ON exercise_attempts
  FOR SELECT
  TO authenticated
  USING (
    class_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = exercise_attempts.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own attempts"
  ON exercise_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own attempts"
  ON exercise_attempts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own attempts"
  ON exercise_attempts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to handle attempt completion
CREATE OR REPLACE FUNCTION handle_attempt_completion()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    NEW.completed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for attempt completion
DROP TRIGGER IF EXISTS on_attempt_completed ON exercise_attempts;
CREATE TRIGGER on_attempt_completed
  BEFORE UPDATE ON exercise_attempts
  FOR EACH ROW EXECUTE FUNCTION handle_attempt_completion();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_exercise_id ON exercise_attempts(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_user_id ON exercise_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_class_id ON exercise_attempts(class_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_started_at ON exercise_attempts(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_completed_at ON exercise_attempts(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_is_completed ON exercise_attempts(is_completed);