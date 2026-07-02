# Progres Proyek & Catatan Rilis (per 20 Juli 2025)

Dokumen ini melacak evolusi proyek, merinci fitur yang berfungsi, bug yang telah diperbaiki (dalam format studi kasus), dan pekerjaan yang tersisa.

## Apa yang Sudah Berfungsi (Fitur Stabil)

*   **Manajemen Pengguna & Peran**: Pendaftaran untuk peran `teacher`, `student`, dan `parent` berfungsi dengan benar.
*   **Manajemen Kelas**: Guru dapat membuat, mengelola, dan menghapus kelas. Siswa dapat bergabung ke kelas menggunakan kode.
*   **Pembuatan Latihan (Exercise Builder)**: Alur kerja 4-langkah untuk membuat latihan menggunakan AI (Pengaturan -> Prompt -> Paste JSON -> Preview) berfungsi sesuai desain.
*   **Penugasan Latihan**: Guru dapat menugaskan latihan ke kelas mereka, dan kebijakan RLS yang relevan telah diperbaiki dan stabil.
*   **Penautan Orang Tua-Anak**: Alur kerja bagi orang tua untuk menautkan akun mereka ke anak melalui kode unik berfungsi dengan baik.
*   **Akses Latihan Publik**: Latihan yang ditandai `is_public` sekarang dapat diakses oleh pengguna yang tidak login (anonim), mendukung fitur berbagi.
*   **Dasbor Guru & Siswa (Versi Awal)**: Komponen dasar untuk dasbor guru dan siswa telah diimplementasikan dan menampilkan data yang relevan.
*   **Sistem Pelacakan Kemajuan (Backend)**: Arsitektur backend yang telah di-refactor dengan tabel `user_progress` dan `class_assignment_progress` telah stabil.
*   **Alur Pengiriman Tugas Siswa**: Setelah perbaikan besar, alur lengkap dari siswa mengerjakan tugas hingga data disimpan di backend dan notifikasi terpicu sekarang berfungsi.
*   **Fitur Laporan Nilai Guru**: Guru dapat melihat laporan nilai yang teragregasi untuk kelas mereka.

---

## Studi Kasus Selesai (Perbaikan Bug & Implementasi Fitur)

### Studi Kasus 15: Perbaikan Alur Pengiriman Tugas Siswa & Notifikasi (Submission & Notification Fix)
- **Status**: `Tested`
- **Gejala Awal**: Pengiriman tugas oleh siswa gagal total karena serangkaian error yang saling terkait: RPC yang usang, trigger notifikasi yang rusak, dan skema database yang tidak sinkron. Ini adalah bug paling kritis yang menghentikan alur kerja inti siswa.
- **Investigasi**:
    - **Analisis Rantai Kegagalan**:
        1.  Frontend memanggil RPC `submit_exercise_attempt` dengan parameter `class_id` yang sudah tidak berlaku.
        2.  RPC gagal karena mengharapkan `class_exercise_id`.
        3.  Bahkan jika RPC berhasil, trigger `handle_exercise_attempt_update` akan gagal karena juga menggunakan logika yang usang.
        4.  Jika trigger berhasil, trigger notifikasi `handle_notification_creation` akan gagal karena mencoba mengisi kolom `link` yang sudah dihapus dan menggunakan tipe ENUM yang salah.
- **Solusi (Serangkaian Migrasi Kritis pada 20 Juli 2025)**:
    1.  **Perbaikan RPC**: Memperbarui fungsi `submit_exercise_attempt` untuk menerima `p_class_exercise_id` dan meneruskannya dengan benar ke `INSERT`. (Lihat: `20250720160000_fix_submit_exercise_attempt_rpc.sql`)
    2.  **Sinkronisasi Skema**: Memperbarui tabel `exercise_attempts` untuk menyelaraskan kolom dan tipe data. (Lihat: `20250720170000_align_exercise_attempts_schema.sql` & `20250720180000_add_status_to_exercise_attempts.sql`)
    3.  **Perbaikan Trigger Notifikasi**: Menulis ulang fungsi trigger `handle_notification_creation` dari awal untuk menghapus referensi ke kolom `link` yang usang dan memperbaiki logika notifikasi. (Lihat: `20250720232000_remove_link_from_central_notification_trigger.sql`)
    4.  **Perbaikan ENUM Notifikasi**: Menambahkan nilai `assignment_graded` ke tipe ENUM `notification_type`. (Lihat: `20250720232500_add_graded_to_notification_enum.sql`)
- **Hasil**: Alur kerja pengiriman tugas siswa berhasil dipulihkan sepenuhnya. Siswa sekarang dapat mengirimkan pekerjaan mereka, kemajuan mereka dicatat dengan benar, dan notifikasi yang relevan dihasilkan tanpa error.

### Studi Kasus 14: Perbaikan RPC Laporan Guru & Siswa (Stale Data & Assignment Errors)
- **Status**: `Tested`
- **Gejala Awal**: Halaman detail kelas untuk guru dan siswa menampilkan data yang salah atau menyebabkan error karena fungsi RPC mereka masih mengkueri tabel `user_progress` yang lama setelah refactoring sistem pelacakan kemajuan.
- **Investigasi**:
    - **Akar Masalah**: Fungsi `get_teacher_class_exercises` dan `get_student_class_assignments` melakukan `JOIN` ke `user_progress` menggunakan `class_id`, yang tidak lagi ada di tabel tersebut.
- **Solusi**:
    1.  **Refactor `get_teacher_class_exercises`**: Mengubah query untuk menghitung jumlah siswa yang mengerjakan dari tabel `class_assignment_progress` yang baru. (Lihat: `20250720140000_fix_get_teacher_class_exercises_rpc.sql`)
    2.  **Refactor `get_student_class_assignments`**: Mengubah `LEFT JOIN` untuk mengambil status kemajuan dari `class_assignment_progress` yang baru. (Lihat: `20250720150000_fix_get_student_class_assignments_rpc.sql`)
- **Hasil**: Kedua fungsi RPC sekarang mengambil data dari sumber yang benar, memastikan bahwa guru dan siswa melihat status tugas yang akurat dan real-time di halaman kelas.

### Studi Kasus 13: Refactoring Sistem Pelacakan Kemajuan
- **Status**: `Tested`
- **Gejala Awal**: Tidak ada cara untuk membedakan antara kemajuan siswa pada latihan mandiri versus kinerja pada tugas kelas. Ini menyebabkan laporan yang tidak akurat untuk guru dan orang tua.
- **Investigasi**:
    - **Akar Masalah**: Tabel `user_progress` yang monolitik tidak dapat menangani dua konteks kemajuan yang berbeda (pribadi vs. kelas).
- **Solusi**:
    1.  **Migrasi Skema**: Membuat tabel baru `class_assignment_progress` untuk secara eksplisit melacak kinerja tugas kelas. Merampingkan tabel `user_progress` untuk hanya melacak penguasaan pribadi.
    2.  **Logika Trigger Terpusat**: Membuat fungsi trigger baru `handle_exercise_attempt_update` yang secara cerdas memperbarui kedua tabel kemajuan sesuai konteks.
    3.  **RPC Baru**: Membuat RPC `get_class_grades_report` untuk membaca dari tabel `class_assignment_progress` yang baru.
- **Hasil**: Arsitektur backend sekarang dapat secara akurat melacak dan melaporkan kemajuan siswa di berbagai konteks, memberikan data yang lebih bermakna bagi semua pengguna.

### Studi Kasus 12: Perbaikan Error Kritis `supabase.from is not a function` pada Halaman Laporan Siswa
- **Status**: `Tested`
- **Akar Masalah**: Komponen `StudentReports.tsx` tidak meneruskan *instance* Supabase client dari hook `useAuth` ke `supabaseService`, menyebabkan `supabase` menjadi `undefined`.
- **Solusi**: Memperbarui `StudentReports.tsx` untuk mengambil dan meneruskan *instance* `supabase` dengan benar.
- **Hasil**: Halaman laporan siswa berfungsi kembali, memulihkan fungsionalitas pemantauan guru.

---

## Apa yang Tersisa untuk Dibangun & Diuji

### Prioritas Utama: Pengujian & Stabilisasi
1.  **Pengujian End-to-End (E2E)**:
    *   **Tujuan**: Memvalidasi semua alur kerja utama setelah perbaikan besar-besaran untuk memastikan tidak ada regresi.
    *   **Skenario Kunci untuk Diuji**:
        *   **Alur Guru**: Buat kelas -> Buat latihan -> Atur pengaturan lanjutan (tenggat, percobaan) -> Tugaskan ke kelas -> Lihat laporan nilai.
        *   **Alur Siswa**: Gabung kelas -> Lihat tugas -> Kerjakan tugas (pastikan aturan diterapkan) -> Kirim -> Lihat hasil.
        *   **Alur Orang Tua**: Tautkan anak -> Lihat laporan anak -> Terima notifikasi kelulusan (`passed`/`failed`).
2.  **Verifikasi Fitur `Untested` Sebelumnya**:
    *   Secara formal menguji **Studi Kasus 7, 8, dan 9** dari `progress.md` versi lama yang sekarang seharusnya berfungsi berkat perbaikan lainnya.

### Prioritas Kedua: Pengembangan Fitur
1.  **Implementasi UI Notifikasi**:
    *   **Tugas**: Membangun `NotificationsPage.tsx` untuk menampilkan daftar notifikasi yang dapat digulir.
    *   **Tugas**: Menyempurnakan `NotificationBell.tsx` untuk menampilkan jumlah notifikasi yang belum dibaca dan mungkin menampilkan pratinjau dropdown.
2.  **Penyempurnaan Dasbor Siswa**:
    *   **Tugas**: Mengintegrasikan data real-time ke semua widget yang telah dibuat (`TodayFocusWidget`, `ProgressWidget`, dll.).
    *   **Tugas**: Mengimplementasikan fungsionalitas filter dan urutkan di `AssignmentsWidget`.

### Rencana Jangka Panjang (Setelah Stabilisasi)
*   **Fitur Bank Soal (Model Kloning)**: Mengimplementasikan fitur "Jadikan Milikku" yang memungkinkan guru menyalin dan memodifikasi latihan dari perpustakaan publik.
*   **Gamifikasi**: Mengembangkan lebih lanjut sistem poin dan lencana untuk meningkatkan keterlibatan siswa.
