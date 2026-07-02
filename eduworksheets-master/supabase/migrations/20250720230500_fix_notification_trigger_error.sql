-- This migration fixes a critical bug where exercise submissions failed
-- because an outdated notification trigger was trying to use a non-existent 'link' column.

-- == STEP 1: Drop the trigger and all dependent functions in the correct order ==
DROP TRIGGER IF EXISTS attempt_completed_notification_trigger ON public.exercise_attempts;
DROP FUNCTION IF EXISTS public.notify_on_attempt_completion();
DROP FUNCTION IF EXISTS public.create_notification(UUID, TEXT, public.notification_type);

-- == STEP 2: Recreate the 'create_notification' helper function with the correct signature ==
-- This version removes the 'p_link' parameter and the corresponding 'link' column
-- from the INSERT statement, aligning it with the actual 'notifications' table schema.
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_message TEXT,
    p_type public.notification_type
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO notifications (user_id, message, type)
    VALUES (p_user_id, p_message, p_type);
END;
$$ LANGUAGE plpgsql;


-- == STEP 3: Recreate the 'notify_on_attempt_completion' trigger function ==
-- This version is identical to the previous one, but it is recreated to depend on the
-- new, corrected version of 'create_notification'.
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
    SELECT u.name INTO v_student_name FROM users u WHERE u.id = NEW.user_id;
    SELECT e.title INTO v_exercise_title FROM exercises e WHERE e.id = NEW.exercise_id;

    -- Find the class_id from the class_exercises table
    SELECT ce.class_id INTO v_class_id
    FROM class_exercises ce
    WHERE ce.id = NEW.class_exercise_id;

    -- Get teacher_id from the class if class_id was found
    IF v_class_id IS NOT NULL THEN
        SELECT c.teacher_id INTO v_teacher_id
        FROM classes c
        WHERE c.id = v_class_id;
    END IF;

    -- Get linked parent_ids
    SELECT array_agg(pcl.parent_id) INTO v_parent_ids
    FROM parent_child_link pcl
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
        PERFORM create_notification(v_teacher_id, v_notification_message, v_notification_type);
    END IF;

    -- Notify the parents
    IF v_parent_ids IS NOT NULL THEN
        FOR i IN 1..array_length(v_parent_ids, 1) LOOP
            PERFORM create_notification(v_parent_ids[i], v_notification_message, v_notification_type);
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- == STEP 4: Re-enable the trigger ==
-- The trigger itself does not need to be changed, but we re-create it to ensure
-- it is linked to the newly defined function.
CREATE TRIGGER attempt_completed_notification_trigger
AFTER INSERT ON public.exercise_attempts
FOR EACH ROW
EXECUTE FUNCTION notify_on_attempt_completion();
