# Studi Kasus: Regresi Kritis pada Akses Latihan Guru

**Tanggal:** 20 Juli 2025

**Status:** Terselesaikan (Resolved)

## 1. Ringkasan Masalah

Terjadi error runtime kritis yang menyebabkan aplikasi crash saat seorang guru mencoba berinteraksi dengan latihan yang ditugaskan di halaman "Detail Kelas". Masalah ini muncul dalam dua skenario:

1.  **Crash pada Pengaturan:** Saat mengklik ikon "Settings" pada kartu latihan, aplikasi crash dengan error `Uncaught TypeError: Cannot read properties of undefined (reading 'title')` yang berasal dari komponen `ClassExerciseSettingsModal.tsx`.
2.  **Kegagalan Akses Latihan:** Saat mencoba membuka halaman untuk mengerjakan latihan (Take Exercise), terjadi kegagalan pengambilan data dari API, yang ditandai dengan status HTTP 406 di log konsol.

Masalah ini secara spesifik berdampak pada pengguna dengan peran `teacher` dan menandakan adanya regresi dari perbaikan sebelumnya yang terdokumentasi dalam `study_case_rpc_data_mismatch.md`.

## 2. Analisis dan Investigasi

Investigasi dilakukan dengan cermat, mempertimbangkan konteks dari perbaikan sebelumnya.

### Langkah 1: Analisis Laporan Error & Konteks Historis

Laporan error awal menunjukkan dua gejala: crash di frontend dan kegagalan API. Saya segera merujuk ke `study_case_rpc_data_mismatch.md`. Dokumen tersebut menjelaskan bahwa crash serupa pernah terjadi karena ketidakcocokan antara data *flattened* (`FlatClassExercise`) yang dikembalikan oleh RPC `get_teacher_class_exercises` dan ekspektasi komponen UI yang mengharapkan data *nested*.

Perbaikan sebelumnya adalah dengan menyesuaikan komponen UI untuk bekerja dengan tipe `FlatClassExercise`. Fakta bahwa error yang sama muncul kembali menunjukkan bahwa perbaikan tersebut, meskipun benar pada saat itu, tidak mencakup semua kasus penggunaan.

### Langkah 2: Menelusuri Alur Data Guru

Saya merekonstruksi alur data untuk peran guru di `ClassDetailPage.tsx`:

1.  Komponen memanggil `supabaseService.getClassExercises`, yang mengeksekusi RPC `get_teacher_class_exercises`.
2.  RPC ini mengembalikan daftar latihan dalam format `FlatClassExercise`. Data ini cukup untuk ditampilkan di kartu ringkasan, tetapi tidak memiliki detail lengkap seperti daftar pertanyaan (`questions`).
3.  **Skenario Crash:** Saat tombol "Settings" diklik, objek `FlatClassExercise` yang tidak lengkap ini diteruskan ke `ClassExerciseSettingsModal`. Meskipun modal telah disesuaikan untuk menangani beberapa properti datar, ada bagian dari modal yang masih secara implisit atau eksplisit mengharapkan data yang lebih kaya, yang menyebabkan crash.
4.  **Skenario Kegagalan API:** Saat tombol "View/Take Exercise" diklik, aplikasi mencoba menavigasi ke rute generik `/exercise/:id`. Halaman ini (`PublicTakeExercisePage.tsx`) memanggil `supabaseService.getExerciseWithQuestions`. Panggilan ini gagal karena kebijakan RLS (Row Level Security) yang ketat. RLS tidak mengizinkan guru untuk secara bebas mengambil data dari tabel `exercises` hanya berdasarkan ID, terutama jika latihan tersebut bukan miliknya (misalnya, latihan dari perpustakaan publik). Akses seharusnya divalidasi melalui keanggotaan kelas.

### Langkah 3: Mengidentifikasi Akar Masalah

Akar masalahnya adalah **celah dalam arsitektur pengambilan data untuk guru**. Perbaikan sebelumnya adalah adaptasi UI yang reaktif. Namun, tidak ada mekanisme backend yang aman dan terpusat bagi seorang guru untuk mengambil **detail lengkap** sebuah latihan (termasuk pertanyaan) dalam konteks kelas tempat latihan itu ditugaskan.

Ketergantungan pada data `FlatClassExercise` yang terbatas untuk semua interaksi lanjutan (pengaturan, pengerjaan) adalah sumber utama dari regresi ini.

## 3. Rencana Resolusi Komprehensif

Untuk mengatasi masalah ini secara tuntas dan mencegah regresi di masa depan, diperlukan solusi berlapis yang memperkuat arsitektur backend dan menyempurnakan alur frontend.

### Bagian 1: Penguatan Backend dengan RPC Baru

Membuat fungsi RPC (Remote Procedure Call) baru di database yang dirancang khusus untuk kasus penggunaan ini.

*   **Nama Fungsi:** `get_class_exercise_details_for_teacher`
*   **Parameter:** `p_class_id UUID`, `p_exercise_id UUID`
*   **Logika Inti:**
    1.  Dijalankan dengan `SECURITY DEFINER` untuk melakukan pemeriksaan keamanan secara terkendali.
    2.  **Validasi #1:** Memastikan `auth.uid()` adalah guru dari kelas yang sesuai (`p_class_id`).
    3.  **Validasi #2:** Memastikan ada entri di `class_exercises` yang menghubungkan `p_class_id` dan `p_exercise_id`.
    4.  Jika kedua validasi lolos, lakukan `JOIN` antara `exercises`, `class_exercises`, dan `questions` untuk mengambil data yang lengkap dan komprehensif.
    5.  Mengembalikan satu objek JSON yang berisi semua detail yang diperlukan.

### Bagian 2: Refaktor Alur Frontend

Mengintegrasikan RPC baru ke dalam alur kerja guru di frontend.

1.  **Layanan (`supabaseService.ts`):** Menambahkan fungsi baru `getClassExerciseDetailsForTeacher` yang memanggil RPC di atas.
2.  **Halaman Detail Kelas (`ClassDetailPage.tsx`):**
    *   **Logika "Settings":** Saat tombol "Settings" diklik, panggil `getClassExerciseDetailsForTeacher`. Tampilkan state loading, dan hanya setelah data lengkap diterima, buka `ClassExerciseSettingsModal` dengan data yang kaya tersebut.
    *   **Logika "Take Exercise":** Mengubah navigasi. Alih-alih ke rute publik, arahkan ke rute baru yang dilindungi khusus untuk guru, misalnya `/class/:classId/take-exercise/:exerciseId`.
3.  **Halaman Baru (`TeacherTakeExercisePage.tsx`):** Membuat komponen halaman baru untuk rute di atas. Halaman ini akan secara eksklusif menggunakan `getClassExerciseDetailsForTeacher` untuk mengambil datanya, memastikan guru selalu memiliki akses yang sah dan data yang lengkap.
4.  **Routing (`router/index.tsx`):** Mendaftarkan rute baru untuk `TeacherTakeExercisePage`.

Pendekatan ini secara definitif menyelesaikan bug dengan menyediakan data yang benar melalui saluran yang aman, selaras dengan praktik terbaik arsitektur Supabase, dan mencakup semua skenario yang sebelumnya gagal.

### Pembaruan 19 Juli 2025 (Malam): Analisis Mendalam & Penemuan Akar Masalah Sebenarnya

Setelah serangkaian perbaikan frontend yang tampaknya logis (memperbaiki prop `onView` dan `context` di `ExerciseCard.tsx`) gagal menyelesaikan masalah, investigasi dialihkan ke lapisan backend, khususnya Row Level Security (RLS). Analisis terhadap kebijakan RLS pada tabel `exercises` dan `questions` mengungkapkan akar masalah yang sebenarnya dan jauh lebih mendasar.

**Akar Masalah Final & Definitif: Celah Kritis dalam Kebijakan RLS**

Masalah inti **bukan** pada logika frontend, melainkan pada **izin akses data di level database**. Kebijakan RLS yang ada untuk tabel `exercises` dan `questions` hanya memberikan akses baca dalam dua kondisi:
1.  Jika pengguna yang diautentikasi adalah **pembuat** latihan (`creator_id = auth.uid()`).
2.  Jika latihan tersebut ditandai sebagai **publik** (`is_public = true`).

Skenario kritis yang gagal ditangani adalah:
> Ketika seorang guru (`Teacher A`) menugaskan latihan yang dibuat oleh guru lain (`Teacher B`) dari perpustakaan ke kelasnya, `Teacher A` dan murid-muridnya tidak memiliki hak akses untuk membaca data latihan tersebut berdasarkan kebijakan RLS yang ada, karena mereka bukan pembuatnya dan latihan itu mungkin tidak bersifat publik.

Navigasi yang salah ke `PublicTakeExercisePage` hanyalah **gejala**. Penyebab sebenarnya adalah ketika halaman tersebut mencoba memanggil `supabaseService.getExerciseWithQuestions`, RLS di PostgreSQL secara benar menolak permintaan tersebut karena tidak ada kebijakan yang mengizinkannya. Ini menghasilkan error `HTTP 406 (Not Acceptable)` dan `PGRST116 (0 rows returned)` yang konsisten, karena dari sudut pandang guru tersebut, latihan itu memang tidak ada.

RPC `get_class_exercise_details_for_teacher` yang dibuat sebelumnya adalah langkah yang baik, tetapi tidak akan pernah berhasil jika kebijakan RLS di level tabel dasar sudah terlebih dahulu memblokir akses ke data mentah yang coba diambil oleh fungsi tersebut.

## 4. Rencana Resolusi Final (Gabungan Backend & Frontend)

Untuk mengatasi masalah ini secara holistik, diperlukan perbaikan di kedua lapisan.

### Bagian 1: Penguatan Backend dengan Kebijakan RLS Baru

Langkah paling krusial adalah membuat kebijakan RLS baru yang memberikan akses baca kepada anggota kelas (guru dan siswa) untuk latihan yang telah ditugaskan kepada mereka.

1.  **Membuat Fungsi Helper `is_class_member` (jika belum ada):** Membuat fungsi SQL `is_class_member(class_id UUID, user_id UUID)` yang memeriksa apakah seorang pengguna adalah guru atau siswa di kelas tertentu.
2.  **Menambahkan Kebijakan RLS di `exercises`:**
    *   **Nama:** `Enable read access for class members`
    *   **Tipe:** `SELECT`
    *   **Logika:** `USING (EXISTS (SELECT 1 FROM class_exercises ce JOIN class_students cs ON ce.class_id = cs.class_id WHERE ce.exercise_id = id AND (cs.student_id = auth.uid() OR (SELECT teacher_id FROM classes WHERE id = ce.class_id) = auth.uid())))`
3.  **Menambahkan Kebijakan RLS di `questions`:**
    *   **Nama:** `Enable read access for class members`
    *   **Tipe:** `SELECT`
    *   **Logika:** `USING (EXISTS (SELECT 1 FROM exercises e JOIN class_exercises ce ON e.id = ce.exercise_id JOIN class_students cs ON ce.class_id = cs.class_id WHERE e.id = questions.exercise_id AND (cs.student_id = auth.uid() OR (SELECT teacher_id FROM classes WHERE id = ce.class_id) = auth.uid())))`

### Bagian 2: Finalisasi Perbaikan Frontend

Meskipun masalah utama ada di backend, perbaikan frontend yang telah dilakukan tetap penting untuk memastikan alur navigasi yang benar dan efisien.

1.  **Verifikasi `ExerciseCard.tsx`:** Memastikan logika `onClick` pada tombol "Latihan" secara andal menggunakan prop `onView` ketika `context` adalah `classDetail`.
2.  **Verifikasi `ClassDetailPage.tsx`:** Memastikan prop `onView` diteruskan dengan benar ke `ExerciseCard` dan menunjuk ke fungsi `handleViewExercise` yang menavigasi ke rute guru yang dilindungi (`/class/:classId/take-exercise/:exerciseId`).

Dengan mengimplementasikan kebijakan RLS yang baru, kita menutup celah keamanan dan logika di backend. Dikombinasikan dengan alur navigasi frontend yang benar, seluruh fitur akan berfungsi seperti yang diharapkan, aman, dan andal.

### Pembaruan 20 Juli 2025: Pivot Investigasi & Penemuan Akar Masalah Final

Investigasi mengambil arah yang sama sekali baru setelah menerima informasi penting: **menonaktifkan RLS pada tabel `exercises` dan `questions` sama sekali tidak menyelesaikan masalah**. Error `406` dan `Exercise not found` tetap muncul. Ini adalah bukti konklusif bahwa RLS bukanlah akar masalahnya, dan investigasi sebelumnya yang berfokus pada RLS adalah sebuah kekeliruan.

Dengan RLS dikesampingkan, fokus kembali sepenuhnya ke alur logika frontend dan struktur data. Log konsol yang secara konsisten menunjukkan bahwa `PublicTakeExercisePage` dipanggil adalah petunjuk yang paling jelas. Ini berarti, terlepas dari semua perbaikan pada prop, kondisi `if (context === 'classDetail' && onView)` di `ExerciseCard.tsx` selalu gagal.

Analisis yang lebih mendalam pada tipe data yang digunakan mengungkapkan kebenaran:

**Akar Masalah Final yang Sebenarnya: Ketidakcocokan ID Properti**

1.  **Sumber Data:** `ClassDetailPage` mengambil daftar latihannya menggunakan RPC `get_teacher_class_exercises`. RPC ini mengembalikan objek `FlatClassExercise`, yang merupakan gabungan data dari `exercises` dan `class_exercises`.
2.  **Struktur Tipe:**
    *   Tipe `Exercise` (dari tabel `exercises`) memiliki Primary Key `id`.
    *   Tipe `FlatClassExercise` (dari RPC) juga memiliki properti `id`, tetapi `id` ini berasal dari tabel `class_exercises` (ID penugasan), bukan dari tabel `exercises`. ID latihan yang sebenarnya disimpan dalam properti `exercise_id`.
3.  **Logika yang Salah:** Di dalam `ExerciseCard.tsx`, logika fallback pada tombol "Latihan" adalah `navigate('/take-exercise/${exercise.id}')`.
4.  **Kegagalan:** Ketika `ExerciseCard` menerima `FlatClassExercise` dari `ClassDetailPage`, `exercise.id` yang digunakannya adalah ID dari `class_exercises`. URL yang dihasilkan menjadi, misalnya, `/take-exercise/uuid-dari-class_exercises`, yang tentu saja tidak akan ditemukan di `PublicTakeExercisePage` yang mencari berdasarkan ID dari tabel `exercises`.

Inilah mengapa error "Exercise not found" terus terjadi. Alur navigasi tidak hanya salah, tetapi juga menggunakan ID yang salah, membuatnya gagal total.

## 5. Rencana Resolusi Definitif dan Proses Debugging Iteratif

Perbaikan awal berfokus pada frontend untuk mengatasi masalah ketidakcocokan ID. Namun, ini mengungkap serangkaian masalah yang lebih dalam di lapisan backend, yang memerlukan proses debugging iteratif untuk menyelesaikannya secara tuntas.

### Langkah 1: Perbaikan Awal di Frontend (`ExerciseCard.tsx`)

*   **Masalah:** Logika navigasi di `ExerciseCard.tsx` salah menggunakan `exercise.id` (yang merupakan ID dari `class_exercises`) saat seharusnya menggunakan `exercise.exercise_id` (ID dari `exercises`).
*   **Solusi:** Memperkenalkan variabel `exerciseId` yang secara cerdas memilih ID yang benar (`'exercise_id' in exercise ? exercise.exercise_id : exercise.id`). Variabel ini kemudian digunakan di semua fungsi navigasi, `onDelete`, dan `share`.
*   **Hasil:** Perbaikan ini berhasil mengarahkan frontend untuk memanggil RPC backend yang benar (`get_class_exercise_details_for_teacher`), namun ini memicu serangkaian error baru dari database.

### Langkah 2: Debugging Error RPC di Backend (Iterasi 1 - Nama Kolom)

*   **Error:** `Error: column e.views does not exist`.
*   **Analisis:** Fungsi RPC `get_class_exercise_details_for_teacher` mencoba mengambil kolom `e.views` dan `e.ratings` dari tabel `exercises`. Setelah memeriksa skema tabel, ditemukan bahwa nama kolom yang benar adalah `e.view_count` dan `e.like_count`.
*   **Solusi:** Membuat file migrasi baru (`20250720002100_...`) untuk memperbarui fungsi RPC dengan nama kolom yang benar.

### Langkah 3: Debugging Error RPC di Backend (Iterasi 2 - Kolom Refactor)

*   **Error:** `Error: column ce.settings does not exist`.
*   **Analisis:** Fungsi RPC masih mencoba mengambil kolom `ce.settings` dari tabel `class_exercises`. Investigasi pada file migrasi `20250718152100_refactor_class_exercise_settings.sql` menunjukkan bahwa kolom `settings` (JSONB) telah dihapus dan digantikan oleh kolom-kolom individual (`time_limit`, `randomize_questions`, `show_answers_policy`, dll.).
*   **Solusi:** Memperbarui kembali file migrasi untuk menghapus referensi ke `ce.settings` dan menggantinya dengan kolom-kolom individual yang baru.

### Langkah 4: Debugging Error RPC di Backend (Iterasi 3 - Tipe Data ENUM)

*   **Error:** `Error: structure of query does not match function result type` dan `type public.curriculum_type_enum does not exist`.
*   **Analisis:** Error ini menunjukkan ketidakcocokan antara tipe data yang didefinisikan di bagian `RETURNS TABLE` fungsi dan tipe data yang sebenarnya dikembalikan oleh query `SELECT`. Secara spesifik, beberapa kolom yang menggunakan tipe data ENUM (seperti `difficulty`, `semester`, dan `curriculum_type`) didefinisikan dengan nama tipe yang salah di dalam fungsi.
*   **Solusi:** Dengan bantuan query `pg_type` dan `pg_enum` untuk mendapatkan daftar semua tipe ENUM yang ada di database, file migrasi disempurnakan untuk terakhir kalinya. Definisi `RETURNS TABLE` diubah untuk menggunakan nama tipe ENUM yang benar (`public.difficulty_level`, `public.semester_enum`, `public.curriculum_type`), memastikan kecocokan 100% dengan skema database.

## 6. Solusi Akhir yang Komprehensif

Solusi final adalah kombinasi dari perbaikan frontend dan backend yang disempurnakan melalui beberapa iterasi:

1.  **Frontend (`ExerciseCard.tsx`):** Logika komponen diperkuat untuk selalu menggunakan ID latihan yang benar, memastikan permintaan ke backend selalu valid.
2.  **Backend (RPC `get_class_exercise_details_for_teacher`):** Fungsi RPC diperbarui secara menyeluruh melalui file migrasi tunggal (`20250720002100_fix_get_class_exercise_details_for_teacher_rpc.sql`) untuk:
    *   Menggunakan nama kolom yang benar (`view_count`, `like_count`).
    *   Mengambil data dari kolom pengaturan yang telah di-refactor (`time_limit`, `max_attempts`, dll.).
    *   Mendefinisikan tipe data `RETURNS TABLE` yang cocok persis dengan tipe data ENUM aktual di database.

Kombinasi perbaikan ini berhasil menyelesaikan semua error yang dilaporkan dan memulihkan fungsionalitas akses latihan guru secara penuh.
