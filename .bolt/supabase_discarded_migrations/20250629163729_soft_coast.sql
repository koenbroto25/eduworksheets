-- Create indexes for questions table
CREATE INDEX IF NOT EXISTS idx_questions_exercise_id ON questions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_order_index ON questions(exercise_id, order_index);