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