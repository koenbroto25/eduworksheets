# Studi Kasus: Refactoring Fundamental Pelacakan Kemajuan Siswa

**Tanggal Laporan:** 20 Juli 2025
**Status:** Implementasi Selesai, Status: UNTESTED
**Dokumen Terkait:** `study_case_student_progress_not_saving.md`

## 1. Latar Belakang & Tujuan

Dokumen ini adalah kelanjutan dari investigasi pada `study_case_student_progress_not_saving.md`. Meskipun serangkaian perbaikan telah dilakukan, error `400 (Bad Request)` saat menyimpan pengerjaan siswa masih berlanjut. Analisis mendalam pada fungsi trigger `update_user_progress()` mengungkap masalah arsitektur yang fundamental, bukan sekadar bug implementasi.

Tujuan dari studi kasus ini adalah untuk mendokumentasikan proses brainstorming, analisis, dan rencana aksi final untuk merombak total (`refactor`) cara sistem melacak kemajuan siswa. Rencana ini tidak hanya akan menyelesaikan error yang ada secara permanen tetapi juga membangun fondasi yang lebih kokoh dan skalabel untuk fitur-fitur di masa depan.

## 2. Analisis Masalah Arsitektur

Investigasi awal yang berfokus pada perbaikan kecil gagal karena masalahnya lebih dalam dari yang diperkirakan. Akar masalahnya adalah **konflik konseptual** dalam desain tabel `user_progress`.

### Konflik Konseptual: Dua Jenis "Kemajuan"

Melalui diskusi, kami mengidentifikasi bahwa sistem secara keliru mencoba menggabungkan dua konsep kemajuan yang berbeda ke dalam satu tabel:

1.  **Kemajuan Personal Siswa (Rapor Pribadi):**
    *   **Definisi:** Performa terbaik seorang siswa pada sebuah latihan secara umum, tidak peduli dari mana latihan itu diakses (kelas A, kelas B, atau perpustakaan publik).
    *   **Kebutuhan:** Untuk dasbor pribadi siswa dan laporan 360 derajat bagi orang tua yang ingin melihat inisiatif belajar mandiri anak.
    *   **Kunci Unik Seharusnya:** `(user_id, exercise_id)`.

2.  **Kemajuan Tugas Kelas (Lembar Penilaian Guru):**
    *   **Definisi:** Performa seorang siswa pada sebuah latihan sebagai *tugas spesifik* di dalam kelas tertentu, yang terikat pada aturan yang ditetapkan guru (nilai minimal, tenggat waktu, dll.).
    *   **Kebutuhan:** Untuk fitur vital "Laporan Nilai" di dasbor guru, yang memerlukan analisis per kelas.
    *   **Kunci Unik Seharusnya:** `(class_id, exercise_id, student_id)`.

Implementasi saat ini mencoba memaksakan kedua konsep ini ke dalam tabel `user_progress` dengan menambahkan `class_id` ke dalam klausa `ON CONFLICT`. Ini menyebabkan:
*   **Error Teknis:** Pelanggaran *constraint* database ketika siswa mengerjakan latihan non-kelas (`class_id` adalah `NULL`), yang menjadi penyebab utama error `400` yang sedang terjadi.
*   **Kerancuan Data:** Data kemajuan personal tercampur dengan data laporan kelas, merusak integritas kedua jenis laporan.

## 3. Brainstorming Solusi Arsitektur

Kami mempertimbangkan dua pendekatan utama:

*   **Opsi 1: Arsitektur "Pemisahan Murni" (Membuat Tabel Baru):** Memisahkan kedua konsep kemajuan ke dalam tabelnya masing-masing. Ini adalah solusi yang paling bersih dan skalabel.
*   **Opsi 2: Arsitektur "Virtualisasi Laporan" (Menggunakan VIEW):** Menjaga struktur tabel tetap ramping dan menghasilkan laporan kelas secara dinamis melalui `VIEW`. Solusi ini lebih cepat diimplementasikan tetapi berisiko mengalami masalah performa di masa depan.

**Keputusan:** Kami sepakat untuk memilih **Opsi 1** sebagai investasi jangka panjang dalam kesehatan dan kejelasan arsitektur data.

## 4. Rencana Aksi Final yang Disepakati

Rencana ini dirancang untuk mengimplementasikan arsitektur "Pemisahan Murni".

### Langkah 1: Migrasi Database (Backend)

Akan dibuat satu file migrasi komprehensif (`supabase/migrations/20250720120000_refactor_progress_tracking.sql`) yang akan melakukan hal berikut:

**A. Membuat Tabel Baru: `class_assignment_progress`**
Tabel ini akan menjadi sumber data utama untuk laporan guru.
```sql
CREATE TABLE public.class_assignment_progress (
    class_exercise_id uuid NOT NULL REFERENCES public.class_exercises(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    best_score integer,
    attempts_count integer NOT NULL DEFAULT 0,
    status public.progress_status_enum NOT NULL DEFAULT 'not_started',
    first_attempted_at timestamptz,
    last_attempted_at timestamptz,
    completed_at timestamptz,
    PRIMARY KEY (class_exercise_id, student_id)
);
-- Tambahkan indeks untuk query yang efisien
CREATE INDEX idx_class_assignment_progress_student ON public.class_assignment_progress(student_id);
```

**B. Merombak Tabel `user_progress`**
Tabel ini akan dikembalikan ke tujuan aslinya: melacak kemajuan personal.
*   Hapus kolom `class_id`.
*   Hapus kolom `status` (karena status kelulusan sekarang spesifik per tugas kelas).
*   Ganti nama `best_score` menjadi `best_score_overall` untuk kejelasan.
*   Pastikan *primary key* adalah `(user_id, exercise_id)`.

**C. Merombak Fungsi Trigger `update_user_progress()`**
Logika fungsi ini akan ditulis ulang sepenuhnya untuk melayani kedua tabel:
1.  **Selalu** hitung dan perbarui ringkasan kemajuan personal di tabel `user_progress` (berdasarkan `NEW.user_id` dan `NEW.exercise_id`).
2.  **Jika `NEW.class_id` TIDAK NULL**:
    *   Cari `class_exercise_id` yang sesuai.
    *   Hitung dan perbarui ringkasan laporan kelas di tabel `class_assignment_progress`.
    *   Terapkan logika untuk status `completed_late` berdasarkan `due_date`.

### Langkah 2: Penyesuaian Frontend (Selesai)

Setelah migrasi backend berhasil diterapkan, serangkaian penyesuaian di frontend telah dilakukan untuk menyelaraskan aplikasi dengan arsitektur data yang baru.

1.  **Dedikasi Ulang `src/pages/TakeExercisePage.tsx`:**
    *   **Tujuan Baru:** Halaman ini akan secara **eksklusif** didedikasikan untuk siswa yang mengerjakan latihan **sebagai tugas dari sebuah kelas**.
    *   **URL Target:** `/class/:classId/exercise/:classExerciseId/take`
    *   **Alur Data:** Saat pengerjaan selesai, komponen ini akan memanggil `submitExerciseAttempt` dengan menyertakan `class_id`, yang akan memicu pembaruan pada kedua tabel progres (`class_assignment_progress` dan `user_progress`).

2.  **Pembuatan Halaman Baru: `src/pages/PublicTakeExercisePage.tsx`:**
    *   **Tujuan:** Halaman baru ini akan dibuat khusus untuk siswa (atau pengguna anonim) yang mengerjakan latihan dari **Perpustakaan Publik**, tanpa ikatan ke kelas.
    *   **URL Target:** `/library/exercise/:exerciseId/take`
    *   **Alur Data:** Saat pengerjaan selesai, komponen ini akan memanggil `submitExerciseAttempt` dengan `class_id` bernilai `NULL`. Ini hanya akan memicu pembaruan pada tabel `user_progress`.

3.  **Penyesuaian Halaman Laporan & Dasbor:**
    *   **Halaman Laporan Guru:** Mengubah semua panggilan data agar mengambil dari tabel `class_assignment_progress` (kemungkinan melalui RPC baru yang efisien).
    *   **Dasbor Siswa:** Membuat komponen UI baru untuk "Laporan Kemajuan Pribadi" yang mengambil data dari `user_progress`.
    *   **Dasbor Orang Tua:** Mengimplementasikan dua bagian terpisah: "Laporan Tugas Kelas" (dari `class_assignment_progress`) dan "Aktivitas Belajar Pribadi" (dari `user_progress`) untuk memberikan gambaran 360 derajat.

Pemisahan halaman di frontend ini akan menciptakan pemisahan logika yang bersih, mengurangi kompleksitas komponen, dan memastikan setiap alur kerja (tugas kelas vs. latihan mandiri) ditangani secara terisolasi dan benar.

4.  **Integrasi RPC Laporan Nilai:**
    *   Fungsi RPC `get_class_grades_report` yang baru telah ditambahkan ke `src/services/supabaseService.ts`.
    *   Komponen `src/components/classroom/ClassGradesGrid.tsx` telah di-refactor sepenuhnya. Komponen ini sekarang memanggil RPC baru dan memproses struktur data datar yang dikembalikan, menyederhanakan logika internalnya secara signifikan.

Dengan mengimplementasikan rencana ini, kami yakin dapat menyelesaikan bug yang ada secara tuntas dan membangun platform yang lebih andal dan kaya fitur. Status saat ini adalah **UNTESTED** dan menunggu verifikasi fungsional.
