-- Function to check for overdue assignments and notify parents
CREATE OR REPLACE FUNCTION public.notify_parents_of_overdue_assignments()
RETURNS void AS $$
DECLARE
  assignment RECORD;
  parent_record RECORD;
  student_profile RECORD;
  exercise_record RECORD;
BEGIN
  -- Find all assignments that are past their due date and not yet submitted
  FOR assignment IN
    SELECT * FROM public.class_exercises
    WHERE due_date < NOW() AND id NOT IN (
      SELECT assignment_id FROM public.exercise_attempts WHERE submitted_at IS NOT NULL
    )
  LOOP
    -- Get student and exercise details
    SELECT * INTO student_profile FROM public.users WHERE id = assignment.student_id;
    SELECT title INTO exercise_record FROM public.exercises WHERE id = assignment.exercise_id;

    -- Find all parents linked to this student
    FOR parent_record IN
      SELECT parent_id FROM public.parent_child_link WHERE child_id = assignment.student_id
    LOOP
      -- Check if a notification for this overdue assignment already exists for this parent
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE user_id = parent_record.parent_id
          AND message LIKE '%' || exercise_record.title || '%'
          AND type = 'assignment_overdue'
      ) THEN
        -- Insert a notification for the parent
        INSERT INTO public.notifications (user_id, message, type, link)
        VALUES (
          parent_record.parent_id,
          'Assignment for ' || student_profile.full_name || ' is overdue: ' || exercise_record.title,
          'assignment_overdue',
          '/dashboard'
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the function to run once daily
-- Note: The user needs to set this up in the Supabase dashboard under Database > Cron Jobs
-- Example cron schedule: '0 0 * * *' (every day at midnight)
-- Command to schedule:
-- SELECT cron.schedule('daily-overdue-check', '0 0 * * *', 'SELECT public.notify_parents_of_overdue_assignments()');
