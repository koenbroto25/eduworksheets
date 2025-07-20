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