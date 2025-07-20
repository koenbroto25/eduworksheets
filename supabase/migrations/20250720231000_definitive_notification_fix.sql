-- This is the definitive migration to fix all notification-related errors.
-- It drops all legacy notification triggers and functions and recreates them
-- with the correct schema, removing all references to the non-existent 'link' column.

-- == STEP 1: Drop all related triggers and functions to avoid dependency errors ==
DROP TRIGGER IF EXISTS on_student_exercise_completion_notify_parent ON public.exercise_attempts;
DROP TRIGGER IF EXISTS on_new_class_assignment_notify_parent ON public.class_exercises;
DROP TRIGGER IF EXISTS attempt_completed_notification_trigger ON public.exercise_attempts;

DROP FUNCTION IF EXISTS public.handle_completed_exercise_parent_notification();
DROP FUNCTION IF EXISTS public.handle_new_assignment_parent_notification();
DROP FUNCTION IF EXISTS public.notify_on_attempt_completion();
DROP FUNCTION IF EXISTS public.create_notification(UUID, TEXT, public.notification_type);


-- == STEP 2: Recreate the 'create_notification' helper function correctly ==
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_message TEXT,
    p_type public.notification_type
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.notifications (user_id, message, type)
    VALUES (p_user_id, p_message, p_type);
END;
$$ LANGUAGE plpgsql;


-- == STEP 3: Recreate the teacher and parent notification trigger function ==
CREATE OR REPLACE FUNCTION public.notify_on_attempt_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_teacher_id UUID;
    v_parent_ids UUID[];
    v_student_name TEXT;
    v_exercise_title TEXT;
    v_notification_message TEXT;
    v_notification_type public.notification_type;
    v_class_id UUID;
BEGIN
    SELECT u.name INTO v_student_name FROM public.users u WHERE u.id = NEW.user_id;
    SELECT e.title INTO v_exercise_title FROM public.exercises e WHERE e.id = NEW.exercise_id;

    SELECT ce.class_id INTO v_class_id
    FROM public.class_exercises ce
    WHERE ce.id = NEW.class_exercise_id;

    IF v_class_id IS NOT NULL THEN
        SELECT c.teacher_id INTO v_teacher_id
        FROM public.classes c
        WHERE c.id = v_class_id;
    END IF;

    SELECT array_agg(pcl.parent_id) INTO v_parent_ids
    FROM public.parent_child_link pcl
    WHERE pcl.child_id = NEW.user_id;

    IF NEW.status = 'completed_passed' THEN
        v_notification_message := v_student_name || ' has PASSED the exercise: ' || v_exercise_title || ' with a score of ' || NEW.score || '.';
        v_notification_type := 'assignment_completed_passed';
    ELSIF NEW.status = 'completed_failed' THEN
        v_notification_message := v_student_name || ' has completed the exercise: ' || v_exercise_title || ' but did not pass, with a score of ' || NEW.score || '.';
        v_notification_type := 'assignment_completed_failed';
    ELSE
        v_notification_message := v_student_name || ' has submitted an attempt for: ' || v_exercise_title || ' with a score of ' || NEW.score || '.';
        v_notification_type := 'assignment_new';
    END IF;

    IF v_teacher_id IS NOT NULL THEN
        PERFORM public.create_notification(v_teacher_id, v_notification_message, v_notification_type);
    END IF;

    IF v_parent_ids IS NOT NULL THEN
        FOR i IN 1..array_length(v_parent_ids, 1) LOOP
            PERFORM public.create_notification(v_parent_ids[i], v_notification_message, v_notification_type);
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- == STEP 4: Recreate the parent-specific notification functions correctly ==
CREATE OR REPLACE FUNCTION public.handle_new_assignment_parent_notification()
RETURNS TRIGGER AS $$
DECLARE
  parent_record RECORD;
  student_profile RECORD;
  exercise_record RECORD;
BEGIN
  SELECT * INTO student_profile FROM public.users WHERE id = NEW.student_id;
  SELECT title INTO exercise_record FROM public.exercises WHERE id = NEW.exercise_id;

  FOR parent_record IN
    SELECT parent_id FROM public.parent_child_link WHERE child_id = NEW.student_id
  LOOP
    PERFORM public.create_notification(
      parent_record.parent_id,
      student_profile.name || ' has a new assignment: ' || exercise_record.title,
      'assignment_new'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_completed_exercise_parent_notification()
RETURNS TRIGGER AS $$
DECLARE
  parent_record RECORD;
  student_profile RECORD;
  exercise_record RECORD;
BEGIN
  IF NEW.submitted_at IS NOT NULL AND OLD.submitted_at IS NULL THEN
    SELECT * INTO student_profile FROM public.users WHERE id = NEW.user_id;
    SELECT title INTO exercise_record FROM public.exercises WHERE id = NEW.exercise_id;

    FOR parent_record IN
      SELECT parent_id FROM public.parent_child_link WHERE child_id = NEW.user_id
    LOOP
      PERFORM public.create_notification(
        parent_record.parent_id,
        student_profile.name || ' has completed the assignment: ' || exercise_record.title,
        'assignment_completed'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- == STEP 5: Re-enable all triggers ==
CREATE TRIGGER on_new_class_assignment_notify_parent
  AFTER INSERT ON public.class_exercises
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_assignment_parent_notification();

CREATE TRIGGER on_student_exercise_completion_notify_parent
  AFTER UPDATE ON public.exercise_attempts
  FOR EACH ROW EXECUTE FUNCTION public.handle_completed_exercise_parent_notification();

CREATE TRIGGER attempt_completed_notification_trigger
  AFTER INSERT ON public.exercise_attempts
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_attempt_completion();
