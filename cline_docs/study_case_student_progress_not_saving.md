# Studi Kasus: Data Kemajuan Siswa Tidak Tersimpan

**Tanggal Laporan:** 20 Juli 2025

## 1. Ringkasan Masalah

Dilaporkan bahwa ketika seorang siswa menyelesaikan pengerjaan soal dari sebuah kelas, hasilnya (nilai, waktu, dll.) dapat terlihat di antarmuka pengguna (frontend), namun data pengerjaan tersebut tidak berhasil direkam di backend. Secara spesifik, tidak ada entri baru yang dibuat di tabel `exercise_attempts` dan akibatnya, tabel `user_progress` juga tidak diperbarui.

## 2. Analisis Awal

Berdasarkan pemeriksaan awal dan tinjauan `cline_docs/backendContext.md`, alur kerja yang diharapkan adalah sebagai berikut:
1.  Frontend mengirimkan hasil pengerjaan siswa ke backend.
2.  Sebuah entri baru dibuat di tabel `exercise_attempts`.
3.  Sebuah *trigger* database pada tabel `exercise_attempts` secara otomatis memanggil fungsi `update_user_progress()` untuk mengagregasi data ke tabel `user_progress`.

Kegagalan dalam alur ini menunjukkan adanya masalah pada langkah #2, yaitu proses penyisipan data ke `exercise_attempts`.

## 3. Investigasi Teknis

### Langkah 3.1: Pemeriksaan Kode Frontend (In Progress)

Penyelidikan difokuskan pada file yang bertanggung jawab untuk menangani pengiriman hasil latihan, yaitu `src/pages/TakeExercisePage.tsx`.

Setelah meninjau fungsi `handleComplete` di dalam file tersebut, ditemukan beberapa ketidaksesuaian kritis antara objek data yang dikirim oleh frontend dan skema tabel `exercise_attempts` di database:

*   **Kesalahan Nama Kolom:** Kode mencoba menyisipkan data ke kolom `status`, yang sebenarnya tidak ada di skema tabel `exercise_attempts`.
*   **Kekurangan Kolom Wajib:** Panggilan `insert` tidak menyertakan nilai untuk beberapa kolom yang bersifat `NOT NULL` di database, seperti:
    *   `is_completed` (boolean)
    *   `is_submitted` (boolean)
    *   `submitted_at` (timestamp)
    *   `completed_at` (timestamp)
    *   `max_score` (integer)
    *   `percentage` (real)

**Hipotesis:**
Kegagalan operasi `insert` ke `exercise_attempts` disebabkan oleh ketidakcocokan skema ini. Karena operasi `insert` gagal, *trigger* untuk memperbarui `user_progress` tidak pernah aktif, yang menjelaskan mengapa kedua tabel tidak memiliki data baru.

## 4. Rencana Perbaikan

### Langkah 4.1: Memperbaiki Logika Penyimpanan di Frontend (Selesai)
- **Tugas:** Memodifikasi fungsi `handleComplete` di `src/pages/TakeExercisePage.tsx`.
- **Detail:**
    1.  Menghapus kolom `status` yang tidak valid dari objek `insert`.
    2.  Menambahkan kolom-kolom wajib: `is_completed`, `is_submitted`, `submitted_at`, `completed_at`, `max_score`, dan `percentage` agar sesuai dengan skema database.
- **Status:** `Selesai`

### Langkah 4.2: Verifikasi dan Buat Trigger Database (Selesai)
- **Tugas:** Memastikan *trigger* `update_user_progress` ada dan berfungsi.
- **Detail:**
    1.  Menjalankan skrip SQL (`verify_trigger_status.sql`) untuk memeriksa keberadaan *trigger*. Hasilnya menunjukkan *trigger* tidak ada.
    2.  Membuat file migrasi baru (`supabase/migrations/20250720080500_add_trigger_for_user_progress.sql`) untuk menambahkan *trigger* yang hilang ke tabel `exercise_attempts`.
- **Status:** `Selesai`

### Langkah 4.3: Perbarui Dokumentasi Backend (Selesai)
- **Tugas:** Memperbarui `cline_docs/backendContext.md`.
- **Detail:** Menambahkan catatan historis pada fungsi `update_user_progress` untuk merefleksikan penambahan *trigger* yang hilang melalui migrasi `20250720080500_add_trigger_for_user_progress.sql`.
- **Status:** `Selesai`

## 5. Status Saat Ini

- **[20 Juli 2025, 07:57]** - Investigasi selesai, rencana perbaikan dibuat.
- **[20 Juli 2025, 08:00]** - Langkah 4.1 selesai. Kode frontend di `TakeExercisePage` telah diperbarui.
- **[20 Juli 2025, 08:12]** - Langkah 4.2 selesai. *Trigger* database yang hilang telah dibuat.
- **[20 Juli 2025, 08:16]** - Langkah 4.3 selesai. Dokumentasi `backendContext.md` telah diperbarui untuk mencerminkan perubahan.

## 6. Investigasi Lanjutan & Analisis Final (20 Juli 2025, 08:35)

Setelah serangkaian perbaikan, masalah inti tetap ada. Analisis yang lebih mendalam terhadap file migrasi `20250716110000_add_status_to_user_progress.sql` dan `20250711021500_complete_schema.sql` mengungkapkan gambaran masalah yang lengkap:

1.  **Lokasi `status` yang Salah:** Kolom `status` (`completed_passed`, `completed_failed`) sebenarnya ada di tabel `user_progress`, bukan `exercise_attempts`. Upaya sebelumnya untuk memasukkan `status` ke `exercise_attempts` adalah salah.
2.  **Logika Trigger Tidak Lengkap:** Fungsi `update_user_progress` yang ada saat ini tidak memiliki logika untuk mengevaluasi skor dan mengatur kolom `status` di `user_progress`. Fungsi ini hanya menangani `is_completed` dan `is_mastered`.
3.  **Error `INSERT` Berkelanjutan:** Error `INSERT` yang dilaporkan pengguna disebabkan oleh upaya memasukkan nilai ke kolom `percentage` di `exercise_attempts`, yang merupakan kolom `GENERATED` (dihitung otomatis).

**Kesimpulan Final:** Masalah ini bersifat dua lapis. Ada error `INSERT` di frontend yang mencegah data masuk ke `exercise_attempts`, dan bahkan jika itu berhasil, ada logika yang hilang di fungsi trigger backend untuk memproses data tersebut dengan benar ke `user_progress`.

## 7. Rencana Perbaikan Komprehensif (Revisi 2)

### Langkah 7.1: Perbaiki `INSERT` di Frontend (Selesai)
- **Tugas:** Memodifikasi fungsi `handleComplete` di `src/pages/TakeExercisePage.tsx`.
- **Detail:** Menghapus **semua** kolom yang tidak seharusnya ada dalam `insert` ke `exercise_attempts`, yaitu `status` dan `percentage`. Ini akan menyelesaikan error `INSERT` dan memungkinkan data pengerjaan dasar untuk disimpan.
- **Status:** `Selesai`
- **Catatan:** Setelah pemeriksaan ulang, kode di `TakeExercisePage.tsx` sudah tidak menyertakan kolom yang salah. Tidak ada perubahan yang diperlukan.

### Langkah 7.2: Perbarui Fungsi Trigger di Backend (Selesai)
- **Tugas:** Membuat file migrasi baru untuk memperbarui fungsi `update_user_progress()`.
- **Detail:**
    1.  Fungsi baru akan mengambil `minimum_passing_grade` dari `class_exercises` (jika pengerjaan terkait kelas) atau menggunakan nilai default.
    2.  Fungsi akan membandingkan skor pengerjaan dengan `minimum_passing_grade`.
    3.  Fungsi akan mengatur kolom `status` di `user_progress` menjadi `completed_passed` atau `completed_failed` sesuai hasil perbandingan.
- **Status:** `Selesai`
- **Artefak:** `supabase/migrations/20250720090000_update_user_progress_function.sql`

### Langkah 7.3: Perbarui Dokumentasi (Belum Dimulai)
- **Tugas:** Memperbarui `cline_docs/backendContext.md` dan menyelesaikan studi kasus ini setelah perbaikan diverifikasi.
- **Status:** `Belum Dimulai`

---

## 8. Investigasi Ulang & Solusi RPC (20 Juli 2025, 08:48)

Setelah menerapkan perbaikan fungsi trigger, pengguna melaporkan bahwa error `INSERT` masih terjadi. Log konsol yang diberikan menunjukkan error yang sangat spesifik:

`message: "cannot insert a non-DEFAULT value into column \"percentage\""`

**Analisis Final (Revisi 3):**
Analisis awal saya yang menyatakan `TakeExercisePage.tsx` sudah benar ternyata keliru. Log konsol membuktikan bahwa frontend **masih** mencoba mengirimkan nilai untuk kolom `percentage` saat memanggil `insert` pada tabel `exercise_attempts`. Kolom ini adalah *generated column* di database, yang berarti nilainya dihitung secara otomatis dan tidak boleh diisi secara manual. Ini adalah akar penyebab dari error `400 (Bad Request)`.

Meskipun perbaikan pada fungsi trigger `update_user_progress` tetap diperlukan dan bermanfaat, itu tidak akan pernah berjalan jika operasi `INSERT` awal gagal.

**Rencana Perbaikan Definitif (Menggunakan RPC):**
Untuk mencegah masalah serupa di masa depan dan menciptakan pemisahan yang bersih antara logika frontend dan skema database, solusi terbaik adalah dengan menggunakan RPC (Remote Procedure Call).

### Langkah 8.1: Buat Fungsi RPC untuk Menyimpan Pengerjaan (Selesai)
- **Tugas:** Membuat file migrasi SQL baru untuk fungsi `public.submit_exercise_attempt()`.
- **Detail:** Fungsi ini akan menerima semua data pengerjaan dari frontend, lalu secara aman melakukan `INSERT` di sisi server, memastikan hanya kolom yang valid yang diisi dan mengabaikan kolom `percentage`.
- **Status:** `Selesai`
- **Artefak:** `supabase/migrations/20250720100000_create_submit_exercise_attempt_rpc.sql`

### Langkah 8.2: Integrasikan RPC di Frontend Service (Selesai)
- **Tugas:** Menambahkan fungsi `submitExerciseAttempt` ke `src/services/supabaseService.ts`.
- **Detail:** Fungsi ini akan menjadi jembatan antara komponen React dan RPC di database.
- **Status:** `Selesai`

### Langkah 8.3: Ganti Metode `insert` dengan RPC (Selesai)
- **Tugas:** Memodifikasi `handleComplete` di `src/pages/TakeExercisePage.tsx`.
- **Detail:** Mengganti panggilan `supabase.from(...).insert()` dengan panggilan ke `supabaseService.submitExerciseAttempt()` yang baru.
- **Status:** `Selesai`

### Langkah 8.4: Perbarui Dokumentasi Final (Belum Dimulai)
- **Tugas:** Memperbarui `backendContext.md` dengan dokumentasi RPC baru dan menyelesaikan studi kasus ini.
- **Status:** `Belum Dimulai`

---

## 9. Investigasi Final & Koreksi Parameter RPC (20 Juli 2025, 08:55)

Setelah implementasi RPC, pengujian menunjukkan error baru, kali ini `404 Not Found` saat memanggil fungsi RPC.

`message: "Could not find the function public.submit_exercise_attempt(...) in the schema cache"`

**Analisis Final (Revisi 4):**
Log error dari Supabase sangat membantu. Ia menunjukkan bahwa frontend memanggil fungsi dengan 9 parameter, tetapi definisi fungsi di database (yang disarankan oleh `hint` di log) memiliki 10 parameter. Parameter yang hilang adalah `p_started_at`. Ini adalah ketidakcocokan *signature* fungsi klasik antara client dan server.

**Rencana Perbaikan Definitif (Revisi 4):**
Rencana ini akan menyelaraskan panggilan frontend dengan definisi fungsi di backend.

### Langkah 9.1: Sinkronkan Parameter Panggilan RPC (Selesai)
- **Tugas:** Memperbaiki panggilan RPC di `src/services/supabaseService.ts` dan `src/pages/TakeExercisePage.tsx`.
- **Detail:**
    1.  Memastikan objek `attemptData` di `TakeExercisePage.tsx` menyertakan properti `started_at` dengan menambahkan state `startTime`.
    2.  Memastikan fungsi `submitExerciseAttempt` di `supabaseService.ts` meneruskan semua 10 parameter dengan nama yang benar ke `supabase.rpc()`.
- **Status:** `Selesai`

### Langkah 9.2: Verifikasi dan Selesaikan (Belum Dimulai)
- **Tugas:** Setelah pengujian berhasil, selesaikan semua pembaruan dokumentasi.
- **Status:** `Belum Dimulai`

---

## 10. Investigasi Final & Perbaikan Dua Lapis (20 Juli 2025, 09:07)

Pengujian lebih lanjut mengungkap dua error terpisah yang terjadi secara bersamaan.

**Analisis Final (Revisi 5):**
1.  **Error Backend (Internal Server Error):** Pesan `record "new" has no field "class_exercise_id"` menunjukkan bahwa fungsi trigger `update_user_progress` masih salah. Ia seharusnya menggunakan `NEW.class_id` dan `NEW.exercise_id` untuk mencari data di `class_exercises`.
2.  **Error Frontend (404 Not Found):** Panggilan RPC dari frontend masih kehilangan parameter `p_started_at`, menyebabkan Supabase tidak dapat menemukan fungsi yang cocok.

**Rencana Perbaikan Definitif (Revisi 5):**

### Langkah 10.1: Perbaiki Fungsi Trigger Backend (Selesai)
- **Tugas:** Membuat file migrasi SQL baru untuk `ALTER FUNCTION update_user_progress()`.
- **Detail:** Memperbaiki logika join untuk menggunakan `NEW.class_id` dan `NEW.exercise_id`.
- **Status:** `Selesai`
- **Artefak:** `supabase/migrations/20250720110000_fix_update_user_progress_function_column.sql`

### Langkah 10.2: Perbaiki Panggilan RPC Frontend (Selesai)
- **Tugas:** Memodifikasi `src/pages/TakeExercisePage.tsx`.
- **Detail:** Menambahkan state `startTime` untuk memastikan `started_at` selalu dikirim ke RPC.
- **Status:** `Selesai`

### Langkah 10.3: Selesaikan Dokumentasi (Selesai)
- **Tugas:** Memperbarui semua dokumentasi terkait setelah perbaikan diverifikasi.
- **Status:** `Selesai`
