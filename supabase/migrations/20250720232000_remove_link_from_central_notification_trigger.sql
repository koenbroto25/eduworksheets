-- This migration provides the absolute definitive fix for the student submission error
-- by rewriting the undocumented centralized trigger function 'handle_notification_creation'
-- to remove all references to the non-existent 'link' column.

-- == STEP 1: Drop the dependent triggers and the faulty function in the correct order ==
DROP TRIGGER IF EXISTS on_new_assignment_trigger ON public.class_exercises;
DROP TRIGGER IF EXISTS on_new_announcement_trigger ON public.class_announcements;
DROP TRIGGER IF EXISTS on_attempt_change_trigger ON public.exercise_attempts;
DROP FUNCTION IF EXISTS public.handle_notification_creation();

-- == STEP 2: Recreate the function with all 'link' columns removed from INSERT statements ==
CREATE OR REPLACE FUNCTION public.handle_notification_creation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
      INSERT INTO public.notifications (user_id, message, type)
      VALUES (v_student_id, v_message, v_notification_type);
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
      INSERT INTO public.notifications (user_id, message, type)
      VALUES (v_student_id, v_message, v_notification_type);
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
        INSERT INTO public.notifications (user_id, message, type)
        VALUES (v_teacher_id, v_message, v_notification_type);
      END IF;

      -- Notify parents
      IF v_parent_ids IS NOT NULL THEN
        FOREACH v_user_id IN ARRAY v_parent_ids
        LOOP
          INSERT INTO public.notifications (user_id, message, type)
          VALUES (v_user_id, v_message, v_notification_type);
        END LOOP;
      END IF;
    END IF;

    -- Notify student when graded
    IF OLD.score IS NULL AND NEW.score IS NOT NULL THEN
        v_message := 'Tugas Anda untuk ' || v_exercise_title || ' telah dinilai. Nilai Anda: ' || NEW.score || '%.';
        INSERT INTO public.notifications (user_id, message, type)
        VALUES (v_student_id, v_message, 'assignment_graded');
    END IF;

  END IF;

  RETURN NEW;
END;
$function$;

-- == STEP 3: Recreate the triggers to use the corrected function ==
CREATE TRIGGER on_new_assignment_trigger
  AFTER INSERT ON public.class_exercises
  FOR EACH ROW EXECUTE FUNCTION public.handle_notification_creation();

CREATE TRIGGER on_new_announcement_trigger
  AFTER INSERT ON public.class_announcements
  FOR EACH ROW EXECUTE FUNCTION public.handle_notification_creation();

CREATE TRIGGER on_attempt_change_trigger
  AFTER INSERT OR UPDATE ON public.exercise_attempts
  FOR EACH ROW EXECUTE FUNCTION public.handle_notification_creation();
