-- Create trigger for attempt completion
DROP TRIGGER IF EXISTS on_attempt_completed ON exercise_attempts;
CREATE TRIGGER on_attempt_completed
  BEFORE UPDATE ON exercise_attempts
  FOR EACH ROW EXECUTE FUNCTION handle_attempt_completion();

-- Create trigger to update progress on attempt completion
DROP TRIGGER IF EXISTS on_attempt_progress_update ON exercise_attempts;
CREATE TRIGGER on_attempt_progress_update
  AFTER INSERT OR UPDATE ON exercise_attempts
  FOR EACH ROW EXECUTE FUNCTION update_user_progress();

-- Create indexes for exercise_attempts
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_exercise_id ON exercise_attempts(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_user_id ON exercise_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_class_id ON exercise_attempts(class_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_started_at ON exercise_attempts(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_completed_at ON exercise_attempts(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_is_completed ON exercise_attempts(is_completed);

-- Create indexes for user_progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_exercise_id ON user_progress(exercise_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_class_id ON user_progress(class_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_best_score ON user_progress(best_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_last_attempt_at ON user_progress(last_attempt_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_is_completed ON user_progress(is_completed);