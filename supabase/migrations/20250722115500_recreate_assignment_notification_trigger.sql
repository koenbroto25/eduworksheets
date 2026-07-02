-- Step 2 of the definitive fix: Recreate the notification logic with a new, isolated, and correct trigger.

-- First, create the new, dedicated function for handling assignment notifications.
CREATE OR REPLACE FUNCTION public.handle_new_assignment_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_class_name TEXT;
  v_exercise_title TEXT;
  v_student_id UUID;
  v_message TEXT;
BEGIN
  -- Get class and exercise details for the notification message.
  SELECT name INTO v_class_name FROM public.classes WHERE id = NEW.class_id;
  SELECT title INTO v_exercise_title FROM public.exercises WHERE id = NEW.exercise_id;

  -- Loop through all students in the class and create a notification for each one.
  FOR v_student_id IN
    SELECT cs.student_id FROM public.class_students cs WHERE cs.class_id = NEW.class_id AND cs.is_active = true
  LOOP
    v_message := 'Tugas baru di kelas ' || v_class_name || ': ' || v_exercise_title;
    INSERT INTO public.notifications (user_id, message, type)
    VALUES (v_student_id, v_message, 'assignment_new');
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Now, create a new trigger that uses the dedicated function.
CREATE TRIGGER trigger_notify_on_new_assignment
  AFTER INSERT ON public.class_exercises
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_assignment_notification();

-- Finally, re-enable the original, faulty trigger now that our new one is in place.
-- This is to ensure we don't leave the database in a disabled state.
-- The faulty trigger will be removed in a future cleanup migration.
ALTER TABLE public.class_exercises ENABLE TRIGGER on_new_assignment_trigger;
