/*
  # Create user_progress table

  1. New Tables
    - `user_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `exercise_id` (uuid, references exercises)
      - `class_id` (uuid, references classes, optional)
      - `best_score` (integer)
      - `attempts_count` (integer)
      - `total_time_spent` (integer, in seconds)
      - `is_completed` (boolean)
      - `first_attempt_at` (timestamp)
      - `last_attempt_at` (timestamp)
      - `completed_at` (timestamp, optional)

  2. Security
    - Enable RLS on `user_progress` table
    - Add policies for users to read their own progress
    - Add policies for teachers to view student progress in their classes
*/

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  best_score integer NOT NULL DEFAULT 0,
  attempts_count integer NOT NULL DEFAULT 0,
  total_time_spent integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  first_attempt_at timestamptz,
  last_attempt_at timestamptz,
  completed_at timestamptz,
  UNIQUE(user_id, exercise_id, class_id)
);

-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Teachers can read student progress in their classes"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (
    class_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = user_progress.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own progress"
  ON user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress"
  ON user_progress
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create function to update user progress
CREATE OR REPLACE FUNCTION update_user_progress()
RETURNS trigger AS $$
DECLARE
  progress_record user_progress%ROWTYPE;
BEGIN
  -- Only process completed attempts
  IF NEW.is_completed = true THEN
    -- Get or create progress record
    SELECT * INTO progress_record
    FROM user_progress
    WHERE user_id = NEW.user_id 
    AND exercise_id = NEW.exercise_id 
    AND (class_id = NEW.class_id OR (class_id IS NULL AND NEW.class_id IS NULL));

    IF progress_record.id IS NULL THEN
      -- Create new progress record
      INSERT INTO user_progress (
        user_id, exercise_id, class_id, best_score, attempts_count,
        total_time_spent, is_completed, first_attempt_at, last_attempt_at, completed_at
      ) VALUES (
        NEW.user_id, NEW.exercise_id, NEW.class_id, NEW.score, 1,
        NEW.time_elapsed, true, NEW.started_at, NEW.completed_at, NEW.completed_at
      );
    ELSE
      -- Update existing progress record
      UPDATE user_progress SET
        best_score = GREATEST(progress_record.best_score, NEW.score),
        attempts_count = progress_record.attempts_count + 1,
        total_time_spent = progress_record.total_time_spent + NEW.time_elapsed,
        is_completed = true,
        last_attempt_at = NEW.completed_at,
        completed_at = CASE 
          WHEN progress_record.completed_at IS NULL THEN NEW.completed_at
          ELSE progress_record.completed_at
        END
      WHERE id = progress_record.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update progress on attempt completion
DROP TRIGGER IF EXISTS on_attempt_progress_update ON exercise_attempts;
CREATE TRIGGER on_attempt_progress_update
  AFTER INSERT OR UPDATE ON exercise_attempts
  FOR EACH ROW EXECUTE FUNCTION update_user_progress();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_exercise_id ON user_progress(exercise_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_class_id ON user_progress(class_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_best_score ON user_progress(best_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_last_attempt_at ON user_progress(last_attempt_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_is_completed ON user_progress(is_completed);