/*
  # Exercises and Questions System Setup

  This migration sets up the exercises and questions system including:
  1. Exercises table for storing educational content
  2. Questions table linked to exercises
  3. Security policies for exercise and question access
  4. Functions for exercise management
  5. Triggers and indexes for performance
*/

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

-- Create exercises policies
DROP POLICY IF EXISTS "Users can create exercises" ON exercises;
CREATE POLICY "Users can create exercises"
  ON exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can read own exercises" ON exercises;
CREATE POLICY "Users can read own exercises"
  ON exercises
  FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can read public exercises" ON exercises;
CREATE POLICY "Users can read public exercises"
  ON exercises
  FOR SELECT
  TO authenticated
  USING (is_public = true);

DROP POLICY IF EXISTS "Users can update own exercises" ON exercises;
CREATE POLICY "Users can update own exercises"
  ON exercises
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own exercises" ON exercises;
CREATE POLICY "Users can delete own exercises"
  ON exercises
  FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  type question_type NOT NULL,
  question text NOT NULL,
  correct_answer jsonb NOT NULL,
  options jsonb,
  explanation text,
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create questions policies
DROP POLICY IF EXISTS "Users can create questions for own exercises" ON questions;
CREATE POLICY "Users can create questions for own exercises"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercises 
      WHERE exercises.id = questions.exercise_id 
      AND exercises.creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can read questions from own exercises" ON questions;
CREATE POLICY "Users can read questions from own exercises"
  ON questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exercises 
      WHERE exercises.id = questions.exercise_id 
      AND exercises.creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can read questions from public exercises" ON questions;
CREATE POLICY "Users can read questions from public exercises"
  ON questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exercises 
      WHERE exercises.id = questions.exercise_id 
      AND exercises.is_public = true
    )
  );

DROP POLICY IF EXISTS "Users can update questions in own exercises" ON questions;
CREATE POLICY "Users can update questions in own exercises"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exercises 
      WHERE exercises.id = questions.exercise_id 
      AND exercises.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercises 
      WHERE exercises.id = questions.exercise_id 
      AND exercises.creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete questions from own exercises" ON questions;
CREATE POLICY "Users can delete questions from own exercises"
  ON questions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exercises 
      WHERE exercises.id = questions.exercise_id 
      AND exercises.creator_id = auth.uid()
    )
  );

-- Create function to handle exercise updates
CREATE OR REPLACE FUNCTION handle_exercise_update()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS on_exercise_updated ON exercises;
CREATE TRIGGER on_exercise_updated
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION handle_exercise_update();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercises_creator_id ON exercises(creator_id);
CREATE INDEX IF NOT EXISTS idx_exercises_is_public ON exercises(is_public);
CREATE INDEX IF NOT EXISTS idx_exercises_subject ON exercises(subject);
CREATE INDEX IF NOT EXISTS idx_exercises_grade ON exercises(grade);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_created_at ON exercises(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_exercise_id ON questions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_order_index ON questions(exercise_id, order_index);