-- Skrip SQL untuk Memverifikasi Keberadaan Trigger 'update_user_progress'
-- Jalankan skrip ini di editor SQL Supabase Anda untuk memeriksa apakah
-- trigger yang menghubungkan tabel 'exercise_attempts' dengan fungsi
-- 'update_user_progress' sudah ada.

SELECT
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    p.proname AS function_name,
    CASE tgenabled
        WHEN 'O' THEN 'Enabled'
        WHEN 'D' THEN 'Disabled'
        ELSE 'Unknown'
    END AS status
FROM
    pg_trigger t
JOIN
    pg_proc p ON t.tgfoid = p.oid
WHERE
    p.proname = 'update_user_progress';

-- HASIL YANG DIHARAPKAN:
-- Jika trigger sudah ada dan benar, Anda akan melihat baris seperti ini:
--
-- trigger_name              | table_name         | function_name        | status
-- --------------------------+--------------------+----------------------+---------
-- on_exercise_attempt_change| exercise_attempts  | update_user_progress | Enabled
--
-- Jika hasilnya kosong, itu berarti trigger tersebut belum ada, dan file
-- migrasi untuk menambahkannya perlu dijalankan.
