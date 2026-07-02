-- This migration provides the definitive fix for the student submission error
-- by replacing the outdated 'notify_on_attempt_completion' trigger with the
-- correct version from "Studi Kasus 8".

-- == STEP 1: Drop the old trigger and function ==
DROP TRIGGER IF EXISTS attempt_completed_notification_trigger ON public.exercise_attempts;
DROP FUNCTION IF EXISTS public.notify_on_attempt_completion();

-- == STEP 2: Recreate the 'notify_on_attempt_completion' function correctly ==
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
    -- Get student name and exercise title from the new attempt record
    SELECT u.name INTO v_student_name FROM public.users u WHERE u.id = NEW.user_id;
    SELECT e.title INTO v_exercise_title FROM public.exercises e WHERE e.id = NEW.exercise_id;

    -- Find the class_id from the class_exercises table
    SELECT ce.class_id INTO v_class_id
    FROM public.class_exercises ce
    WHERE ce.id = NEW.class_exercise_id;

    -- Get teacher_id from the class if class_id was found
    IF v_class_id IS NOT NULL THEN
        SELECT c.teacher_id INTO v_teacher_id
        FROM public.classes c
        WHERE c.id = v_class_id;
    END IF;

    -- Get linked parent_ids
    SELECT array_agg(pcl.parent_id) INTO v_parent_ids
    FROM public.parent_child_link pcl
    WHERE pcl.child_id = NEW.user_id;

    -- Construct the notification message and type based on the attempt's status
    IF NEW.status = 'completed_passed' THEN
        v_notification_message := v_student_name || ' has PASSED the exercise: ' || v_exercise_title || ' with a score of ' || NEW.score || '.';
        v_notification_type := 'assignment_completed_passed';
    ELSIF NEW.status = 'completed_failed' THEN
        v_notification_message := v_student_name || ' has completed the exercise: ' || v_exercise_title || ' but did not pass, with a score of ' || NEW.score || '.';
        v_notification_type := 'assignment_completed_failed';
    ELSE
        v_notification_message := v_student_name || ' has submitted an attempt for: ' || v_exercise_title || ' with a score of ' || NEW.score || '.';
        v_notification_type := 'assignment_new'; -- Fallback type
    END IF;

    -- Notify the teacher
    IF v_teacher_id IS NOT NULL THEN
        PERFORM public.create_notification(v_teacher_id, v_notification_message, v_notification_type);
    END IF;

    -- Notify the parents
    IF v_parent_ids IS NOT NULL THEN
        FOR i IN 1..array_length(v_parent_ids, 1) LOOP
            PERFORM public.create_notification(v_parent_ids[i], v_notification_message, v_notification_type);
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- == STEP 3: Re-enable the trigger ==
CREATE TRIGGER attempt_completed_notification_trigger
  AFTER INSERT ON public.exercise_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_attempt_completion();
