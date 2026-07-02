-- Function to notify parent when a new assignment is created for their child
CREATE OR REPLACE FUNCTION public.handle_new_assignment_parent_notification()
RETURNS TRIGGER AS $$
DECLARE
  parent_record RECORD;
  student_profile RECORD;
  exercise_record RECORD;
BEGIN
  -- Get student profile
  SELECT * INTO student_profile FROM public.users WHERE id = NEW.student_id;
  -- Get exercise details
  SELECT title INTO exercise_record FROM public.exercises WHERE id = NEW.exercise_id;

  -- Find all parents linked to this student
  FOR parent_record IN
    SELECT parent_id FROM public.parent_child_link WHERE child_id = NEW.student_id
  LOOP
    -- Insert a notification for the parent
    INSERT INTO public.notifications (user_id, message, type, link)
    VALUES (
      parent_record.parent_id,
      student_profile.full_name || ' has a new assignment: ' || exercise_record.title,
      'assignment_new',
      '/dashboard' -- Or a more specific link if available
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new class assignment is created
CREATE TRIGGER on_new_class_assignment_notify_parent
  AFTER INSERT ON public.class_exercises
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_assignment_parent_notification();

-- Function to notify parent when their child completes an exercise
CREATE OR REPLACE FUNCTION public.handle_completed_exercise_parent_notification()
RETURNS TRIGGER AS $$
DECLARE
  parent_record RECORD;
  student_profile RECORD;
  exercise_record RECORD;
BEGIN
  -- Ensure the exercise was submitted in this update
  IF NEW.submitted_at IS NOT NULL AND OLD.submitted_at IS NULL THEN
    -- Get student profile
    SELECT * INTO student_profile FROM public.users WHERE id = NEW.student_id;
    -- Get exercise details
    SELECT title INTO exercise_record FROM public.exercises WHERE id = NEW.exercise_id;

    -- Find all parents linked to this student
    FOR parent_record IN
      SELECT parent_id FROM public.parent_child_link WHERE child_id = NEW.student_id
    LOOP
      -- Insert a notification for the parent
      INSERT INTO public.notifications (user_id, message, type, link)
      VALUES (
        parent_record.parent_id,
        student_profile.full_name || ' has completed the assignment: ' || exercise_record.title,
        'assignment_completed',
        '/dashboard' -- Or a link to the results
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a student_exercise is updated (i.e., submitted)
CREATE TRIGGER on_student_exercise_completion_notify_parent
  AFTER UPDATE ON public.exercise_attempts
  FOR EACH ROW EXECUTE FUNCTION public.handle_completed_exercise_parent_notification();
