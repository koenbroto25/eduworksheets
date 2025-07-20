-- 1. Handle Notification Creation Trigger
-- This function creates a notification when a new record is inserted into a table.
-- It's a generic function that can be used by different triggers.

CREATE OR REPLACE FUNCTION public.handle_notification_creation()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_message TEXT;
  v_notification_type public.notification_type;
  v_class_id UUID;
  v_student_id UUID;
  v_teacher_id UUID;
  v_parent_ids UUID[];
  v_student_name TEXT;
  v_class_name TEXT;
  v_exercise_title TEXT;
BEGIN
  -- Determine the notification type and recipient based on the table name.
  IF TG_TABLE_NAME = 'class_exercises' THEN
    -- Notification for a new assignment
    v_class_id := NEW.class_id;
    v_notification_type := 'assignment_new';

    -- Get class details
    SELECT name, teacher_id INTO v_class_name, v_teacher_id FROM public.classes WHERE id = v_class_id;
    SELECT title INTO v_exercise_title FROM public.exercises WHERE id = NEW.exercise_id;

    -- Notify all students in the class
    FOR v_student_id IN
      SELECT student_id FROM public.class_students WHERE class_id = v_class_id
    LOOP
      v_message := 'Tugas baru di kelas ' || v_class_name || ': ' || v_exercise_title;
      INSERT INTO public.notifications (user_id, message, type, link)
      VALUES (v_student_id, v_message, v_notification_type, '/class/' || v_class_id || '/exercises');
    END LOOP;

  ELSIF TG_TABLE_NAME = 'class_announcements' THEN
    -- Notification for a new announcement
    v_class_id := NEW.class_id;
    v_notification_type := 'announcement';
    v_message := 'Pengumuman baru di kelas ' || (SELECT name FROM public.classes WHERE id = v_class_id) || ': ' || NEW.message;

    -- Notify all students in the class
    FOR v_student_id IN
      SELECT student_id FROM public.class_students WHERE class_id = v_class_id
    LOOP
      INSERT INTO public.notifications (user_id, message, type, link)
      VALUES (v_student_id, v_message, v_notification_type, '/class/' || v_class_id);
    END LOOP;

  ELSIF TG_TABLE_NAME = 'exercise_attempts' THEN
    -- Notification for a submitted or graded assignment
    v_student_id := NEW.user_id;
    SELECT name INTO v_student_name FROM public.users WHERE id = v_student_id;
    SELECT e.title, ce.class_id INTO v_exercise_title, v_class_id
    FROM public.exercises e
    JOIN public.class_exercises ce ON e.id = ce.exercise_id
    WHERE ce.id = NEW.class_exercise_id;

    SELECT teacher_id INTO v_teacher_id FROM public.classes WHERE id = v_class_id;
    SELECT array_agg(parent_id) INTO v_parent_ids FROM public.parent_child_link WHERE child_id = v_student_id;

    IF OLD IS NULL OR NEW.status <> OLD.status THEN
      -- Determine message and type based on status
      IF NEW.status = 'completed_passed' THEN
        v_message := v_student_name || ' telah LULUS latihan: ' || v_exercise_title || ' dengan nilai ' || NEW.score || '%.';
        v_notification_type := 'assignment_completed_passed';
      ELSIF NEW.status = 'completed_failed' THEN
        v_message := v_student_name || ' telah menyelesaikan latihan: ' || v_exercise_title || ' namun GAGAL, dengan nilai ' || NEW.score || '%.';
        v_notification_type := 'assignment_completed_failed';
      ELSE -- submitted
        v_message := v_student_name || ' telah mengumpulkan latihan: ' || v_exercise_title;
        v_notification_type := 'assignment_new';
      END IF;

      -- Notify teacher
      IF v_teacher_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, message, type, link)
        VALUES (v_teacher_id, v_message, v_notification_type, '/class/' || v_class_id || '/report');
      END IF;

      -- Notify parents
      IF v_parent_ids IS NOT NULL THEN
        FOREACH v_user_id IN ARRAY v_parent_ids
        LOOP
          INSERT INTO public.notifications (user_id, message, type, link)
          VALUES (v_user_id, v_message, v_notification_type, '/child-report/' || v_student_id);
        END LOOP;
      END IF;
    END IF;

    -- Notify student when graded
    IF OLD.score IS NULL AND NEW.score IS NOT NULL THEN
        v_message := 'Tugas Anda untuk ' || v_exercise_title || ' telah dinilai. Nilai Anda: ' || NEW.score || '%.';
        INSERT INTO public.notifications (user_id, message, type, link)
        VALUES (v_student_id, v_message, 'assignment_graded', '/exercise/' || NEW.exercise_id || '/results/' || NEW.id);
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for the respective tables
DROP TRIGGER IF EXISTS on_new_assignment_trigger ON public.class_exercises;
CREATE TRIGGER on_new_assignment_trigger
AFTER INSERT ON public.class_exercises
FOR EACH ROW EXECUTE FUNCTION handle_notification_creation();

DROP TRIGGER IF EXISTS on_new_announcement_trigger ON public.class_announcements;
CREATE TRIGGER on_new_announcement_trigger
AFTER INSERT ON public.class_announcements
FOR EACH ROW EXECUTE FUNCTION handle_notification_creation();

DROP TRIGGER IF EXISTS on_attempt_change_trigger ON public.exercise_attempts;
CREATE TRIGGER on_attempt_change_trigger
AFTER INSERT OR UPDATE ON public.exercise_attempts
FOR EACH ROW EXECUTE FUNCTION handle_notification_creation();


-- 2. Check Overdue Assignments Cron Job
-- This function checks for overdue assignments and sends notifications.
-- It is intended to be run periodically by a cron job.

CREATE OR REPLACE FUNCTION public.check_overdue_assignments()
RETURNS void AS $$
DECLARE
  overdue_assignment RECORD;
  student_name TEXT;
  parent_ids UUID[];
  teacher_id UUID;
  notification_message TEXT;
BEGIN
  FOR overdue_assignment IN
    SELECT
      ce.id as class_exercise_id,
      ce.class_id,
      ce.exercise_id,
      ce.due_date,
      cs.student_id,
      e.title as exercise_title,
      c.name as class_name
    FROM public.class_exercises ce
    JOIN public.class_students cs ON ce.class_id = cs.class_id
    JOIN public.exercises e ON ce.exercise_id = e.id
    JOIN public.classes c ON ce.class_id = c.id
    WHERE ce.due_date < NOW()
      AND NOT EXISTS (
        SELECT 1
        FROM public.exercise_attempts ea
        WHERE ea.class_exercise_id = ce.id AND ea.user_id = cs.student_id
      )
  LOOP
    -- Get student, teacher, and parent info
    SELECT name INTO student_name FROM public.users WHERE id = overdue_assignment.student_id;
    SELECT c.teacher_id INTO teacher_id FROM public.classes c WHERE c.id = overdue_assignment.class_id;
    SELECT array_agg(pcl.parent_id) INTO parent_ids FROM public.parent_child_link pcl WHERE pcl.child_id = overdue_assignment.student_id;

    notification_message := 'Tugas "' || overdue_assignment.exercise_title || '" untuk ' || student_name || ' di kelas ' || overdue_assignment.class_name || ' sudah lewat tenggat.';

    -- Check if a notification already exists to avoid duplicates
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = overdue_assignment.student_id
        AND link = '/class/' || overdue_assignment.class_id || '/exercises'
        AND type = 'assignment_overdue'
        AND message LIKE '%' || overdue_assignment.exercise_title || '%'
    ) THEN
      -- Notify Student
      INSERT INTO public.notifications (user_id, message, type, link)
      VALUES (overdue_assignment.student_id, notification_message, 'assignment_overdue', '/class/' || overdue_assignment.class_id || '/exercises');

      -- Notify Teacher
      IF teacher_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, message, type, link)
        VALUES (teacher_id, notification_message, 'assignment_overdue', '/class/' || overdue_assignment.class_id || '/report');
      END IF;

      -- Notify Parents
      IF parent_ids IS NOT NULL THEN
        FOREACH teacher_id IN ARRAY parent_ids -- Re-using teacher_id variable for parent_id
        LOOP
          INSERT INTO public.notifications (user_id, message, type, link)
          VALUES (teacher_id, notification_message, 'assignment_overdue', '/child-report/' || overdue_assignment.student_id);
        END LOOP;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- To schedule this function to run daily at 1 AM server time:
-- SELECT cron.schedule('daily-overdue-check', '0 1 * * *', 'SELECT public.check_overdue_assignments()');
-- Note: Ensure the cron extension is enabled in Supabase.
