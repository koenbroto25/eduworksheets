/*
  # Create questions table

  1. New Tables
    - `questions`
      - `id` (uuid, primary key)
      - `exercise_id` (uuid, references exercises)
      - `type` (enum: multiple_choice, short_answer, true_false, matching)
      - `question` (text)
      - `correct_answer` (jsonb)
      - `options` (jsonb, optional for multiple choice)
      - `explanation` (text, optional)
      - `difficulty` (enum: easy, medium, hard)
      - `order_index` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `questions` table
    - Add policies based on exercise ownership and public access
*/

-- Create enum for question types
CREATE TYPE question_type AS ENUM ('multiple_choice', 'short_answer', 'true_false', 'matching');

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

-- Create policies
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_exercise_id ON questions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_order_index ON questions(exercise_id, order_index);