# Studi Kasus: Perbaikan Fungsi RPC Guru Pasca-Refactoring

**Tanggal Laporan:** 20 Juli 2025
**Status:** Terselesaikan (Resolved)
**Dokumen Terkait:** `study_case_refactor_progress_tracking.md`, `backendContext.md`

## 1. Latar Belakang Masalah

Setelah implementasi refactoring besar pada sistem pelacakan kemajuan (`study_case_refactor_progress_tracking.md`), sebuah error kritis muncul ketika pengguna dengan peran `teacher` mengakses halaman detail kelas. Error yang dilaporkan adalah `Error: column up.class_id does not exist`.

Error ini secara langsung menandakan bahwa ada bagian dari kode backend yang belum diperbarui untuk mengikuti arsitektur data yang baru, di mana tabel `user_progress` tidak lagi memiliki kolom `class_id`.

## 2. Analisis & Investigasi

Investigasi difokuskan untuk menemukan fungsi RPC (Remote Procedure Call) yang dipanggil oleh halaman detail kelas guru dan masih mereferensikan kolom yang sudah usang.

1.  **Identifikasi Pemicu:** Error terjadi di halaman detail kelas guru (`ClassDetailPage.tsx`). Komponen ini bertanggung jawab untuk menampilkan daftar semua latihan yang ditugaskan ke kelas tersebut.
2.  **Identifikasi Fungsi RPC:** Berdasarkan `supabaseService.ts` dan `backendContext.md`, fungsi yang mengambil data ini adalah `get_teacher_class_exercises(p_class_id uuid)`. Deskripsi fungsi ini menyebutkan bahwa ia juga "menghitung jumlah siswa yang telah mengerjakan setiap tugas."
3.  **Penemuan Akar Masalah:** Setelah memeriksa definisi fungsi di file migrasi `...create_get_teacher_class_exercises_function.sql`, akar masalah berhasil diidentifikasi. Fungsi tersebut berisi subquery yang salah:
    ```sql
    (
        SELECT COUNT(DISTINCT up.user_id)
        FROM user_progress up
        WHERE up.class_id = ce.class_id AND up.exercise_id = ce.exercise_id
    ) AS student_submissions
    ```
    Subquery ini secara keliru masih mencoba menggunakan `user_progress.class_id`, yang telah dihapus selama refactoring.

## 3. Rencana Perbaikan

Solusinya adalah dengan memperbarui fungsi `get_teacher_class_exercises` agar menggunakan tabel `class_assignment_progress` yang baru, yang memang dirancang untuk menyimpan data kemajuan per tugas kelas.

Logika subquery yang salah harus diganti dengan logika yang benar secara arsitektural:

```sql
(
    SELECT COUNT(DISTINCT cap.student_id)
    FROM class_assignment_progress cap
    WHERE cap.class_exercise_id = ce.id
) AS student_submissions
```

Perubahan ini menyelaraskan fungsi dengan skema database saat ini, mengambil data dari sumber yang benar (`class_assignment_progress`) dan menggunakan kunci relasi yang tepat (`class_exercise_id`).

## 4. Implementasi & Proses Debugging

Sebuah file migrasi baru (`20250720140000_fix_get_teacher_class_exercises_rpc.sql`) dibuat untuk menerapkan perbaikan ini. Namun, implementasi awal mengandung kesalahan:

1.  **Error Awal:** `column up.class_id does not exist`. Ini diperbaiki dengan mengubah subquery untuk menggunakan `class_assignment_progress`.
2.  **Error Kedua:** `column ce.created_at does not exist`. Perbaikan pertama secara keliru menggunakan `ce.created_at` sebagai alias untuk tanggal penugasan. Setelah memeriksa skema, ini dikoreksi menjadi `ce.assigned_at`.

File migrasi final yang telah diperbaiki berhasil menyelesaikan kedua error tersebut secara tuntas dan memulihkan fungsionalitas halaman detail kelas untuk guru.
