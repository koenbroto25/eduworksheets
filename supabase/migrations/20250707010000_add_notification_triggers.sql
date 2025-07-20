-- Function to create a notification
DROP FUNCTION IF EXISTS create_notification(UUID, TEXT, public.notification_type);
CREATE OR REPLACE FUNCTION create_notification(
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

-- Trigger for when a student joins a class
DROP TRIGGER IF EXISTS student_joined_class_trigger ON public.class_students;
DROP FUNCTION IF EXISTS notify_teacher_on_join();
CREATE OR REPLACE FUNCTION notify_teacher_on_join()
RETURNS TRIGGER AS $$
DECLARE
    teacher_id UUID;
    student_name TEXT;
    class_name TEXT;
BEGIN
    -- Get teacher_id from the classes table
    SELECT c.teacher_id, c.name INTO teacher_id, class_name
    FROM classes c
    WHERE c.id = NEW.class_id;

    -- Get student name
    SELECT u.name INTO student_name
    FROM users u
    WHERE u.id = NEW.student_id;

    -- Create notification for the teacher
    PERFORM create_notification(
        teacher_id,
        student_name || ' has joined your class: ' || class_name,
        'class_join'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_joined_class_trigger
AFTER INSERT ON public.class_students
FOR EACH ROW
EXECUTE FUNCTION notify_teacher_on_join();

-- This trigger function is now more robust.
DROP TRIGGER IF EXISTS attempt_completed_notification_trigger ON public.exercise_attempts;
DROP FUNCTION IF EXISTS notify_on_attempt_completion();
CREATE OR REPLACE FUNCTION notify_on_attempt_completion()
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
    WHERE ce.exercise_id = NEW.exercise_id
    AND ce.id = NEW.class_exercise_id; -- Assuming class_exercise_id is on the attempt

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
        v_notification_message := v_student_name || ' has PASSED the exercise: ' || v_exercise_title || ' with a score of ' || NEW.score || '%.';
        v_notification_type := 'assignment_completed_passed';
    ELSIF NEW.status = 'completed_failed' THEN
        v_notification_message := v_student_name || ' has completed the exercise: ' || v_exercise_title || ' but did not pass, with a score of ' || NEW.score || '%.';
        v_notification_type := 'assignment_completed_failed';
    ELSE
        v_notification_message := v_student_name || ' has submitted an attempt for: ' || v_exercise_title || ' with a score of ' || NEW.score || '%.';
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

CREATE TRIGGER attempt_completed_notification_trigger
AFTER INSERT ON public.exercise_attempts
FOR EACH ROW
EXECUTE FUNCTION notify_on_attempt_completion();

-- Trigger for when a teacher grades work
DROP TRIGGER IF EXISTS work_graded_trigger ON public.exercise_attempts;
DROP FUNCTION IF EXISTS notify_student_on_grade();
CREATE OR REPLACE FUNCTION notify_student_on_grade()
RETURNS TRIGGER AS $$
DECLARE
    student_id UUID;
    exercise_title TEXT;
BEGIN
    -- The user_id on exercise_attempts is the student_id
    student_id := NEW.user_id;

    -- Get exercise title
    SELECT e.title INTO exercise_title
    FROM exercises e
    JOIN class_exercises ce ON e.id = ce.exercise_id
    WHERE ce.id = NEW.class_exercise_id;

    -- Create notification for the student
    PERFORM create_notification(
        student_id,
        'Your work has been graded for: ' || exercise_title,
        'assignment_new' -- Or a more specific type if available
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER work_graded_trigger
AFTER UPDATE OF score ON public.exercise_attempts
FOR EACH ROW
WHEN (OLD.score IS NULL AND NEW.score IS NOT NULL)
EXECUTE FUNCTION notify_student_on_grade();
