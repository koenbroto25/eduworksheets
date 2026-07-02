# Studi Kasus: Perbaikan Error Akses Tugas Kelas oleh Siswa

**Tanggal Laporan:** 20 Juli 2025
**Status:** Terselesaikan (Resolved)
**Dokumen Terkait:** `backendContext.md`, `study_case_refactor_progress_tracking.md`, `study_case_teacher_class_exercise_stale_rpc.md`

## 1. Latar Belakang Masalah

Setelah refactoring besar pada sistem pelacakan kemajuan (`20250720120000_refactor_progress_tracking.sql`), sebuah error kritis dilaporkan terjadi ketika pengguna dengan peran `student` mencoba mengakses halaman detail kelas (`StudentClassPage.tsx`). Error yang muncul di frontend adalah `Error: column up.class_id does not exist`.

Error ini mengindikasikan bahwa sebuah fungsi RPC yang dipanggil oleh halaman tersebut masih mencoba mengakses kolom `class_id` pada tabel `user_progress`, padahal kolom tersebut telah dihapus sebagai bagian dari refactoring arsitektur.

## 2. Analisis & Investigasi

Investigasi mengikuti pola yang sama dengan masalah yang sebelumnya terjadi pada sisi guru (`study_case_teacher_class_exercise_stale_rpc.md`).

1.  **Identifikasi Pemicu:** Error terjadi saat siswa membuka halaman detail kelas untuk melihat daftar tugas mereka.
2.  **Identifikasi Fungsi RPC:** Berdasarkan `backendContext.md` dan alur kerja aplikasi, fungsi yang bertanggung jawab untuk mengambil data ini adalah `get_student_class_assignments(p_class_id uuid)`. Dokumentasi mengkonfirmasi bahwa fungsi ini dirancang untuk mengambil semua latihan yang ditugaskan ke kelas dan menggabungkannya dengan status kemajuan siswa.
3.  **Penemuan Akar Masalah:** Pemeriksaan kode sumber fungsi `get_student_class_assignments` (dari migrasi `20250719140000_create_get_student_class_assignments_function.sql`) mengungkapkan adanya `LEFT JOIN` yang usang dan menjadi penyebab error:

    ```sql
    LEFT JOIN
        user_progress up ON ce.exercise_id = up.exercise_id
                         AND ce.class_id = up.class_id  -- <-- TITIK KEGAGALAN
                         AND up.user_id = v_student_id
    ```

    Kondisi `ce.class_id = up.class_id` secara langsung mereferensikan `up.class_id` (alias untuk `user_progress.class_id`), yang tidak ada lagi.

## 3. Rencana Perbaikan

Solusi yang diusulkan adalah membuat file migrasi baru untuk memperbarui fungsi `get_student_class_assignments` agar selaras dengan arsitektur database yang baru.

1.  **Target Fungsi:** `public.get_student_class_assignments(p_class_id uuid)`
2.  **Logika Perbaikan:** Mengganti `LEFT JOIN` ke `user_progress` dengan `LEFT JOIN` ke tabel `class_assignment_progress` yang baru. Tabel ini secara spesifik dirancang untuk melacak kemajuan siswa pada tugas-tugas kelas.

### Logika Query Baru yang Diusulkan:

```sql
-- ... (definisi fungsi)
RETURN QUERY
SELECT
    ce.id,
    ce.exercise_id,
    e.title AS exercise_title,
    ce.assigned_at,
    ce.due_date,
    COALESCE(cap.status, 'not_started')::text AS status,
    cap.best_score AS score
FROM
    class_exercises ce
JOIN
    exercises e ON ce.exercise_id = e.id
LEFT JOIN
    -- JOIN ke tabel yang benar menggunakan relasi yang tepat
    class_assignment_progress cap ON ce.id = cap.class_exercise_id
                                 AND cap.student_id = v_student_id
WHERE
    ce.class_id = p_class_id
ORDER BY
    ce.assigned_at DESC;
-- ... (akhir fungsi)
```

### Langkah Implementasi:

1.  Membuat file migrasi baru dengan nama `20250720150000_fix_get_student_class_assignments_rpc.sql`.
2.  Menyalin seluruh definisi fungsi `CREATE OR REPLACE FUNCTION` ke dalam file tersebut.
3.  Mengganti blok `LEFT JOIN` yang lama dengan blok `LEFT JOIN` baru yang menargetkan `class_assignment_progress`.
4.  Memastikan kolom yang dipilih (`cap.status`, `cap.best_score`) dan tipe datanya cocok dengan definisi `RETURNS TABLE` fungsi.

## 4. Resolusi

Masalah ini berhasil diselesaikan dengan membuat dan menerapkan file migrasi:
- `supabase/migrations/20250720150000_fix_get_student_class_assignments_rpc.sql`

Migrasi ini memperbarui fungsi `get_student_class_assignments` untuk menggunakan arsitektur pelacakan kemajuan yang benar, sehingga menghilangkan referensi ke kolom `user_progress.class_id` yang sudah tidak ada. Setelah migrasi diterapkan, fungsionalitas pada halaman detail kelas siswa kembali normal.
