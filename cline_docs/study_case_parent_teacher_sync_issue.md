# Studi Kasus: Sinkronisasi Tugas Guru ke Dasbor Orang Tua

Dokumen ini merinci masalah, langkah-langkah perbaikan yang telah diambil, dan status saat ini terkait isu sinkronisasi data tugas antara tampilan guru, siswa, dan orang tua.

## 1. Masalah Awal

- **Laporan:** Tugas yang ditambahkan oleh guru ke sebuah kelas (`class_exercises`) tidak muncul sebagai "Tugas Aktif" di dasbor orang tua (`ParentDashboard` -> `ChildCard`).
- **Analisis Awal:** Ditemukan bahwa tidak ada mekanisme di backend untuk menggabungkan tugas yang diberikan langsung oleh orang tua (`parent_assignments`) dengan tugas yang berasal dari kelas.

## 2. Rencana Perbaikan Awal

- **Solusi yang Diusulkan:** Membuat fungsi RPC (Remote Procedure Call) baru di database bernama `get_child_active_assignments` yang akan menjadi satu-satunya sumber data untuk tugas aktif anak.
- **Logika Fungsi:**
    1.  Mengambil tugas dari `parent_assignments`.
    2.  Mengambil tugas dari `class_exercises` untuk semua kelas yang diikuti anak.
    3.  Menggabungkan kedua hasil tersebut.
    4.  Memfilter hasil gabungan dengan memeriksa tabel `user_progress` untuk mengecualikan tugas yang sudah dikerjakan.
    5.  Mengamankan fungsi agar hanya bisa dipanggil oleh orang tua yang sah.
- **Implementasi:**
    - **Backend:** Membuat file migrasi `20250719000000_create_get_child_active_assignments_function.sql`.
    - **Frontend:**
        - Menambahkan pemanggilan RPC baru di `src/services/supabaseService.ts`.
        - Memperbarui `src/components/dashboard/ParentDashboard.tsx` untuk menggunakan fungsi layanan data yang baru.
        - Memperbarui `src/components/dashboard/ChildCard.tsx` untuk merender struktur data baru dari RPC.

## 3. Masalah Lanjutan & Perbaikan Iterasi Kedua

- **Laporan Baru:** Setelah implementasi awal, muncul beberapa masalah baru:
    1.  Halaman detail kelas guru menjadi *crash* (layar putih).
    2.  Tugas di halaman kelas siswa menjadi hilang.
    3.  Tugas aktif di `ChildCard` orang tua menjadi 0, bahkan untuk tugas yang diberikan orang tua.
- **Analisis Lanjutan (Berdasarkan Log Konsol):**
    - Ditemukan error `TypeError: Cannot read properties of undefined (reading 'title')` di `ExerciseCard.tsx`.
    - **Akar Masalah:** Perubahan di `supabaseService.ts` untuk `getClassExercises` (yang seharusnya hanya untuk guru) secara tidak sengaja diubah untuk menggunakan RPC baru, yang mengembalikan format data yang berbeda (datar) dari yang diharapkan oleh komponen `ExerciseCard` (yang mengharapkan objek bersarang `exercise.title`).
- **Rencana Perbaikan Kedua:**
    1.  **Memperbaiki Fungsi `get_child_active_assignments`:** Ditemukan *bug* kecil di mana fungsi mencoba membaca `settings->>'dueDate'` padahal seharusnya `due_date`. Ini diperbaiki dalam file migrasi yang sama.
    2.  **Membuat Fungsi Khusus Guru:** Untuk mengisolasi logika, dibuat RPC baru `get_teacher_class_exercises` (`20250719120000_create_get_teacher_class_exercises_function.sql`) khusus untuk halaman detail kelas guru.
    3.  **Memperbarui Layanan Data:** `supabaseService.ts` diubah agar `getClassExercises` memanggil RPC guru yang baru, mengembalikan fungsionalitas seperti semula.
    4.  **Menyesuaikan Komponen Frontend:**
        - `ExerciseCard.tsx` diperbarui untuk dapat menangani kedua format data (`exercise.title` dan `exercise_title`) agar lebih fleksibel.
        - `ClassDetailPage.tsx` disesuaikan untuk mengirimkan *prop* `exercise` dengan benar ke `ExerciseCard` sesuai dengan format data baru dari RPC guru.

## 4. Status Saat Ini (Error yang Masih Terjadi)

- **Sudah Berhasil:**
    - Halaman detail kelas guru sekarang dapat diakses dan menampilkan daftar tugas dengan benar.
- **Masih Bermasalah:**
    - **Dasbor Orang Tua:** "Tugas Aktif" di `ChildCard` masih menampilkan 0, meskipun fungsi `get_child_active_assignments` seharusnya sudah diperbaiki. Ini menunjukkan masih ada masalah, entah di dalam logika fungsi SQL itu sendiri atau cara data tersebut diproses di `ParentDashboard.tsx` atau `ChildCard.tsx`.
    - **Halaman Kelas Siswa:** Tugas yang seharusnya terlihat oleh siswa masih belum muncul. Ini kemungkinan besar disebabkan oleh masalah yang sama dengan `ChildCard`, di mana komponen yang menampilkan daftar tugas siswa belum disesuaikan untuk menangani format data yang dikembalikan oleh `get_teacher_class_exercises`.

Langkah selanjutnya adalah fokus pada dua area yang masih bermasalah tersebut.

### Fase 1: Validasi dan Perbaikan Backend (Fungsi RPC)

Tujuan dari fase ini adalah untuk memastikan bahwa sumber data (fungsi-fungsi di database) sudah benar, akurat, dan aman sebelum menyentuh kode frontend.

1.  **Analisis `get_child_active_assignments`**:
    *   **Tindakan:** Membaca kode SQL dari `supabase/migrations/20250719000000_create_get_child_active_assignments_function.sql`.
    *   **Fokus Investigasi:**
        *   Logika `UNION ALL` untuk menggabungkan tugas dari `parent_assignments` dan `class_exercises`.
        *   Kebenaran `JOIN` ke `class_students` untuk mengambil tugas kelas.
        *   Logika `LEFT JOIN` ke `user_progress` dan kondisi `WHERE up.user_id IS NULL` untuk memfilter tugas yang sudah dikerjakan.
        *   Validitas klausa keamanan `is_parent_of(auth.uid(), p_child_id)`.
    *   **Hasil yang Diharapkan:** Keyakinan penuh bahwa fungsi ini secara logis benar atau identifikasi *bug* spesifik yang perlu diperbaiki.

2.  **Analisis `get_teacher_class_exercises`**:
    *   **Tindakan:** Membaca kode SQL dari `supabase/migrations/20250719120000_create_get_teacher_class_exercises_function.sql`.
    *   **Fokus Investigasi:** Memastikan format data yang dikembalikan konsisten dan tidak memiliki efek samping yang bisa memengaruhi halaman siswa.
    *   **Hasil yang Diharapkan:** Verifikasi bahwa fungsi ini aman untuk digunakan oleh guru dan tidak menjadi penyebab masalah di halaman siswa.

### Fase 2: Perbaikan Tampilan Tugas Siswa

Setelah backend diverifikasi, fokus beralih ke frontend siswa.

1.  **Analisis Komponen Siswa**:
    *   **Tindakan:** Memeriksa `src/pages/StudentClassPage.tsx` dan komponen `ExerciseList.tsx`.
    *   **Fokus Investigasi:** Mengidentifikasi fungsi `supabaseService` mana yang saat ini dipanggil untuk mendapatkan tugas kelas siswa.
    *   **Hasil yang Diharapkan:** Menemukan bahwa halaman ini kemungkinan besar masih menggunakan `getClassExercises` yang sekarang dikhususkan untuk guru.

2.  **Membuat RPC Khusus Siswa**:
    *   **Tindakan:** Membuat file migrasi SQL baru untuk fungsi `get_student_class_assignments(p_class_id)`.
    *   **Logika Fungsi:** Fungsi ini akan mirip dengan `get_teacher_class_exercises` tetapi disesuaikan untuk siswa, hanya mengembalikan tugas untuk kelas yang diberikan dan memastikan siswa adalah anggota kelas tersebut.
    *   **Hasil yang Diharapkan:** Sebuah *endpoint* backend yang bersih, terisolasi, dan aman untuk digunakan oleh siswa.

3.  **Implementasi Frontend Siswa**:
    *   **Tindakan:**
        1.  Menambahkan fungsi baru ke `supabaseService.ts`.
        2.  Memperbarui `StudentClassPage.tsx` untuk memanggil fungsi layanan yang baru.
        3.  Memastikan `ExerciseCard.tsx` dapat merender data dari RPC baru dengan benar.
    *   **Hasil yang Diharapkan:** Halaman tugas siswa berfungsi kembali dan menampilkan semua tugas yang relevan dari kelas.

### Fase 3: Perbaikan Dasbor Orang Tua

Fase terakhir adalah memperbaiki masalah utama yang dilaporkan.

1.  **Analisis Komponen Orang Tua**:
    *   **Tindakan:** Memeriksa `src/components/dashboard/ParentDashboard.tsx` dan `src/components/dashboard/ChildCard.tsx`.
    *   **Fokus Investigasi:**
        *   Menganalisis `useEffect` yang memanggil `get_child_active_assignments`.
        *   Menambahkan `console.log` untuk menampilkan data mentah yang dikembalikan oleh RPC, serta *error* apa pun.
    *   **Hasil yang Diharapkan:** Mengidentifikasi apakah masalahnya ada pada pemanggilan data, manajemen *state*, atau cara data di-render.

2.  **Implementasi Perbaikan Frontend Orang Tua**:
    *   **Tindakan:** Berdasarkan temuan dari `console.log`, perbaiki logika di `ChildCard.tsx` atau `ParentDashboard.tsx`. Ini bisa berupa penyesuaian pada cara data diakses (misalnya, `item.exercise_title` vs `item.exercise.title`) atau memperbaiki logika `useEffect`.
    *   **Hasil yang Diharapkan:** Dasbor orang tua menampilkan jumlah tugas aktif yang benar dan sinkron dengan data dari guru dan tugas yang diberikan orang tua.

## 6. Resolusi dan Status Akhir (19 Juli 2025)

Setelah melalui serangkaian perbaikan dan debugging, sebagian besar masalah berhasil diselesaikan.

### 6.1. Rangkuman Perbaikan yang Berhasil

1.  **Perbaikan Fungsi `get_child_active_assignments` (Dasbor Orang Tua):**
    *   **Masalah:** Fungsi awalnya gagal mengambil tugas dari kelas karena melakukan `JOIN` ke tabel `profiles` yang tidak ada.
    *   **Solusi:** File migrasi `20250719130000_fix_get_child_active_assignments_function.sql` dibuat untuk memperbaiki `JOIN` ke tabel `users` yang benar.
    *   **Hasil:** Setelah perbaikan ini dan verifikasi data di database, dasbor orang tua berhasil menampilkan jumlah tugas aktif yang benar, menggabungkan data dari guru dan orang tua.

2.  **Perbaikan Halaman Tugas Siswa:**
    *   **Masalah:** Halaman tugas siswa kosong karena menggunakan *endpoint* (`getClassExercises`) yang telah dikhususkan untuk guru dan mengembalikan format data yang tidak kompatibel.
    *   **Solusi:** Dibuat RPC baru yang didedikasikan untuk siswa, `get_student_class_assignments`, melalui migrasi `20250719140000_create_get_student_class_assignments_function.sql`. Fungsi ini mengembalikan data tugas beserta status kemajuan siswa.
    *   **Integrasi Frontend:** `supabaseService.ts` diperbarui untuk menyertakan fungsi baru, dan komponen `StudentClassPage.tsx` diubah untuk memanggil *endpoint* baru ini.

### 6.2. Resolusi Akhir Isu Enum

- **Error Enum di Halaman Siswa (Telah Diperbaiki):**
    - **Laporan Awal:** Halaman siswa menampilkan error: `Error: invalid input value for enum progress_status_enum: "not-started"`.
    - **Analisis Mendalam:** Setelah investigasi lebih lanjut, ditemukan bahwa nilai `'not-started'` sebenarnya *sudah ada* dalam definisi `progress_status_enum`. Akar masalah yang sebenarnya adalah fungsi `get_student_class_assignments` mengembalikan kolom `status` sebagai tipe data `text` bukan `progress_status_enum`. `COALESCE` antara tipe enum dan string literal menghasilkan `text`, yang menyebabkan potensi konflik tipe data di tempat lain.
    - **Solusi yang Diimplementasikan:**
        1.  Dibuat file migrasi baru: `20250719160000_fix_student_assignments_enum_cast.sql`.
        2.  File migrasi ini menggunakan `DROP FUNCTION` diikuti dengan `CREATE OR REPLACE FUNCTION` untuk memperbarui fungsi `get_student_class_assignments`.
        3.  Definisi fungsi yang baru sekarang secara eksplisit meng-cast nilai default ke tipe yang benar (`'not-started'::progress_status_enum`) dan mengubah tipe data yang dikembalikan untuk kolom `status` menjadi `progress_status_enum`.
    - **Hasil:** Perbaikan ini berhasil menyelesaikan error dan memastikan konsistensi tipe data di seluruh aplikasi.

## 7. Status Akhir (Selesai)

Semua masalah yang terkait dengan sinkronisasi tugas antara guru, siswa, dan orang tua, termasuk error enum, kini telah berhasil diselesaikan. Sistem berfungsi sesuai harapan.
