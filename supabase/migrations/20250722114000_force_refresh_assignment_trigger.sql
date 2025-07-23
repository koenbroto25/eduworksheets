-- This script provides a definitive fix by forcing the trigger on the class_exercises table
-- to re-bind to the latest version of the handle_notification_creation function.

-- Step 1: Drop the existing trigger to remove the old binding.
DROP TRIGGER IF EXISTS on_new_assignment_trigger ON public.class_exercises;

-- Step 2: Recreate the trigger, ensuring it binds to the corrected function.
CREATE TRIGGER on_new_assignment_trigger
  AFTER INSERT ON public.class_exercises
  FOR EACH ROW EXECUTE FUNCTION public.handle_notification_creation();

-- This guarantees that the correct logic is executed upon new assignments.
