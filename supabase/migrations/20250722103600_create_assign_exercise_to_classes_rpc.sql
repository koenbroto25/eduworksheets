CREATE OR REPLACE FUNCTION assign_exercise_to_classes(p_exercise_id UUID, p_class_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class_id UUID;
  v_teacher_id UUID;
BEGIN
  -- Security Check: Ensure the user calling this function is the teacher for ALL specified classes.
  FOREACH v_class_id IN ARRAY p_class_ids
  LOOP
    SELECT teacher_id INTO v_teacher_id FROM public.classes WHERE id = v_class_id;
    IF v_teacher_id IS NULL OR v_teacher_id <> auth.uid() THEN
      RAISE EXCEPTION 'Permission denied: You are not the teacher of class %', v_class_id;
    END IF;
  END LOOP;

  -- Core Logic: Insert the assignments, ignoring any duplicates.
  FOREACH v_class_id IN ARRAY p_class_ids
  LOOP
    INSERT INTO public.class_exercises (class_id, exercise_id, due_date)
    VALUES (v_class_id, p_exercise_id, now() + interval '7 day')
    ON CONFLICT (class_id, exercise_id) DO NOTHING;
  END LOOP;
END;
$$;
