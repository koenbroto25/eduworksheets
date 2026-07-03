-- Drop semua policy yang ada di classes untuk clean slate
DO $x$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'classes' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.classes', r.policyname);
  END LOOP;
END $x$;

-- Fungsi SECURITY DEFINER untuk cek keanggotaan (tidak trigger RLS)
CREATE OR REPLACE FUNCTION public.is_member_of_class(p_class_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_students
    WHERE class_id = p_class_id AND student_id = p_user_id AND is_active = true
  );
$$;

-- Policy sederhana tanpa rekursi
CREATE POLICY "teachers_read_own_classes"
ON public.classes FOR SELECT TO authenticated
USING (teacher_id = auth.uid());

CREATE POLICY "students_read_enrolled_classes"
ON public.classes FOR SELECT TO authenticated
USING (public.is_member_of_class(id, auth.uid()));

CREATE POLICY "teachers_insert_classes"
ON public.classes FOR INSERT TO authenticated
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "teachers_update_classes"
ON public.classes FOR UPDATE TO authenticated
USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "teachers_delete_classes"
ON public.classes FOR DELETE TO authenticated
USING (teacher_id = auth.uid());