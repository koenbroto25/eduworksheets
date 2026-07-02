-- This migration adds the missing trigger to the exercise_attempts table.
-- The trigger calls the update_user_progress() function whenever a new attempt
-- is inserted or an existing one is updated, ensuring that the user_progress
-- table is kept in sync.

-- Drop the trigger if it already exists to make this script rerunnable
DROP TRIGGER IF EXISTS on_exercise_attempt_change ON public.exercise_attempts;

-- Create the trigger
CREATE TRIGGER on_exercise_attempt_change
  AFTER INSERT OR UPDATE ON public.exercise_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_progress();
