# Studi Kasus: Perencanaan Fitur Pelaporan & Perbaikan Bug Kritis RLS

**Tanggal:** 18 Juli 2025
**Penulis:** Cline
**Status:** Fase 1 Selesai

## 1. Ringkasan Eksekutif

Dokumen ini berfungsi sebagai referensi utama untuk serangkaian peningkatan signifikan pada platform EduWorksheets. Ini mencakup dua area utama:
1.  **Perbaikan Bug Kritis (SELESAI):** Diagnosis dan solusi untuk bug "infinite recursion" pada kebijakan Row Level Security (RLS) yang sebelumnya melumpuhkan fungsionalitas halaman kelas.
2.  **Pengembangan Fitur Baru (SELESAI):** Fondasi backend untuk sistem pelaporan dan notifikasi telah selesai.

Tujuan dokumen ini adalah untuk menyatukan semua analisis, keputusan desain, dan rencana teknis ke dalam satu sumber kebenaran sebelum memulai implementasi fitur baru.

---

## 2. Perbaikan Bug Kritis: Rekursi Tak Terbatas pada RLS (SELESAI)

### 2.1. Status

**TERATASI.** Halaman kelas sekarang berfungsi dengan benar untuk semua peran pengguna.

### 2.2. Ringkasan Masalah & Solusi

*   **Masalah Awal:** Pengguna mengalami kesalahan server 500 saat mencoba memuat halaman daftar kelas. Log menunjukkan `infinite recursion detected in policy for relation "class_students"`.
*   **Analisis Akar Masalah:** Masalah ini disebabkan oleh siklus ketergantungan antara kebijakan RLS pada tabel `classes`, `class_students`, dan `users`. Saat frontend meminta data kelas beserta jumlah siswa, PostgreSQL tidak dapat menyelesaikan rantai pemeriksaan izin yang saling terkait.
*   **Solusi yang Diimplementasikan:**
    1.  **Fungsi RPC `get_my_classes()`:** Sebuah fungsi PostgreSQL `SECURITY DEFINER` baru dibuat.
    2.  **Logika Terenkapsulasi:** Fungsi ini secara manual dan prosedural memeriksa peran pengguna (`teacher` atau `student`) dan mengambil kelas yang sesuai beserta jumlah siswa.
    3.  **Bypass RLS:** Dengan berjalan sebagai `SECURITY DEFINER`, fungsi ini dapat melewati RLS yang saling bertentangan untuk kueri ini, secara efektif memutus siklus rekursi.
    4.  **Pembaruan Frontend:** Layanan frontend (`supabaseService.ts`) diperbarui untuk memanggil fungsi `rpc('get_my_classes')` alih-alih melakukan kueri `from('classes')`.

---

## 3. Rencana Pengembangan Fitur (Berikutnya)

Dengan bug yang telah teratasi, kita sekarang dapat fokus pada rencana pengembangan fitur yang telah kita diskusikan.

### 3.1. Analisis Kebutuhan Fitur

1.  **Visibilitas Partisipasi Siswa untuk Orang Tua:** Orang tua memerlukan ringkasan partisipasi anak mereka di setiap kelas pada `ChildCard` di dasbor mereka.
2.  **Tampilan Tugas untuk Siswa & Orang Tua:** Tugas yang diberikan oleh guru harus terlihat jelas di dasbor siswa dan orang tua.
3.  **Pelacakan Upaya Siswa yang Akurat:** Proses pencatatan `exercise_attempts` harus secara eksplisit memperhitungkan parameter yang ditetapkan guru di `class_exercises`.
4.  **Analisis Data Komprehensif:** Data dari `user_progress` dan `exercise_attempts` perlu diolah menjadi analitik yang dapat ditindaklanjuti untuk guru dan ringkasan untuk orang tua.
5.  **Akses Pengumuman Kelas untuk Orang Tua:** Orang tua harus menerima pengumuman yang dibuat guru untuk kelas yang diikuti anak mereka.

### 3.2. Rencana Implementasi

#### Fase 1: Fondasi Backend untuk Pelaporan Lanjutan (SELESAI)

1.  **Penyempurnaan Skema (SELESAI):**
    *   **Tindakan:** Kolom `class_id UUID NULL` telah ditambahkan ke tabel `exercise_attempts` dan `user_progress`.
    *   **Alasan:** Ini sangat penting untuk secara akurat mengaitkan upaya dan kemajuan siswa dengan tugas kelas tertentu, bukan hanya latihan umum.

2.  **Pembuatan Fungsi PostgreSQL Komprehensif (SELESAI):**
    *   **Tujuan:** Memindahkan logika pemrosesan data yang berat ke database.
    *   **`get_student_class_report(p_student_id, p_class_id)`:** Fungsi telah dibuat.
    *   **`get_teacher_class_dashboard(p_class_id)`:** Fungsi telah dibuat.
    *   **`get_student_exercise_details(p_student_id, p_class_exercise_id)`:** Fungsi telah dibuat.

3.  **Revisi Sistem Notifikasi (SELESAI):**
    *   **Tindakan:** Fungsi trigger terpusat `handle_notification_creation()` telah dibuat dan diimplementasikan.
    *   **Pemicu:**
        *   `class_exercises` (insert): Notifikasi tugas baru ke siswa.
        *   `class_announcements` (insert): Notifikasi pengumuman ke siswa.
        *   `exercise_attempts` (insert/update): Notifikasi hasil pengerjaan ke siswa, guru, dan orang tua.
    *   **Pekerjaan Terjadwal (Cron Job):** Fungsi `check_overdue_assignments()` telah dibuat untuk berjalan setiap hari, memberi tahu siswa, guru, dan orang tua tentang tugas yang lewat tenggat.

#### Fase 2: Implementasi Antarmuka Pengguna (Frontend)

1.  **`ChildCard.tsx` (Dasbor Orang Tua):**
    *   Panggil `get_student_class_report` untuk menampilkan ringkasan partisipasi kelas anak.
2.  **`StudentDashboard.tsx`:**
    *   Tampilkan daftar tugas yang jelas dan dapat ditindaklanjuti.
3.  **`ClassReport.tsx` (Dasbor Guru):**
    *   Gunakan `get_teacher_class_dashboard` untuk tampilan utama.
    *   Implementasikan modal detail yang memanggil `get_student_exercise_details`.
4.  **`NotificationBell.tsx` & `NotificationsPage.tsx` (SELESAI):**
    *   Komponen `NotificationBell.tsx` telah disederhanakan untuk bertindak sebagai indikator dan tautan ke halaman notifikasi.
    *   Halaman `NotificationsPage.tsx` baru telah dibuat untuk menampilkan daftar lengkap notifikasi pengguna.

## 4. Urutan Eksekusi yang Direkomendasikan

1.  **SELESAI:** Perbaikan bug RLS.
2.  **SELESAI:** Migrasi untuk menambahkan `class_id` ke `exercise_attempts` dan `user_progress`.
3.  **SELESAI:** Pengembangan fungsi-fungsi PostgreSQL untuk pelaporan.
4.  **SELESAI:** Pengembangan komponen UI (`ChildCard.tsx`, `ClassReport.tsx`, dll.) untuk memanggil fungsi RPC yang baru.
5.  **SELESAI:** Implementasi sistem notifikasi yang disempurnakan, baik backend maupun frontend.
