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