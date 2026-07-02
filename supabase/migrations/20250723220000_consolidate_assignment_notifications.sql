-- MIGRATION DEFINITIF: KONSOLIDASI NOTIFIKASI PENUGASAN
-- Tujuan: 
-- 1. Menghapus secara permanen trigger dan fungsi notifikasi orang tua yang salah.
-- 2. Menggabungkan logika notifikasi orang tua ke dalam trigger notifikasi siswa yang sudah benar.
-- Hasil: Satu trigger tunggal yang efisien dan benar untuk semua notifikasi saat tugas baru diberikan.

-- LANGKAH 1: Hapus trigger yang salah dari tabel class_exercises.
DROP TRIGGER IF EXISTS on_new_class_assignment_notify_parent ON public.class_exercises;

-- LANGKAH 2: Hapus fungsi yang salah dan tidak lagi digunakan.
DROP FUNCTION IF EXISTS public.handle_new_assignment_parent_notification();

-- LANGKAH 3: Perbarui fungsi notifikasi utama untuk mencakup orang tua.
CREATE OR REPLACE FUNCTION public.handle_new_assignment_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_class_name TEXT;
  v_exercise_title TEXT;
  v_student_id UUID;
  v_parent_id UUID;
  v_message TEXT;
  v_student_name TEXT;
BEGIN
  -- Ambil detail kelas dan latihan untuk pesan notifikasi.
  SELECT name INTO v_class_name FROM public.classes WHERE id = NEW.class_id;
  SELECT title INTO v_exercise_title FROM public.exercises WHERE id = NEW.exercise_id;

  -- Loop melalui semua siswa aktif di kelas.
  FOR v_student_id IN
    SELECT cs.student_id FROM public.class_students cs WHERE cs.class_id = NEW.class_id AND cs.is_active = true
  LOOP
    -- Buat notifikasi untuk siswa.
    v_message := 'Tugas baru di kelas ' || v_class_name || ': ' || v_exercise_title;
    INSERT INTO public.notifications (user_id, message, type)
    VALUES (v_student_id, v_message, 'assignment_new');

    -- [LOGIKA BARU] Cari dan beri notifikasi kepada orang tua yang terhubung.
    SELECT name INTO v_student_name FROM public.users WHERE id = v_student_id;
    FOR v_parent_id IN
      SELECT pcl.parent_id FROM public.parent_child_link pcl WHERE pcl.child_id = v_student_id
    LOOP
      v_message := 'Anak Anda, ' || v_student_name || ', memiliki tugas baru di kelas ' || v_class_name || ': ' || v_exercise_title;
      INSERT INTO public.notifications (user_id, message, type)
      VALUES (v_parent_id, v_message, 'assignment_new');
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Catatan: Trigger 'trigger_notify_on_new_assignment' yang ada akan secara otomatis
-- menggunakan versi terbaru dari fungsi 'handle_new_assignment_notification' ini.
-- Tidak perlu DROP/CREATE ulang trigger tersebut.
