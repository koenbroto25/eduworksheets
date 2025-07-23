# Studi Kasus: Error Kunci Duplikat & Trigger Saat Menugaskan Latihan (Analisis Final & Investigasi Lanjutan)

Dokumen ini menganalisis dan memberikan solusi definitif untuk error `duplicate key value violates unique constraint "class_exercises_class_id_exercise_id_key"` dan error turunan `record "new" has no field "student_id"` yang terjadi saat guru mencoba menugaskan latihan ke kelas.

## 1. Deskripsi Masalah

-   **Error Awal:** `duplicate key value violates unique constraint "class_exercises_class_id_exercise_id_key"`. Terjadi saat mencoba menugaskan latihan ke kelas yang sudah memilikinya.
-   **Error Lanjutan:** Setelah beberapa perbaikan, error berubah menjadi `Gagal menugaskan latihan: record "new" has no field "student_id"`. Error ini terjadi bahkan setelah logika penugasan dipindahkan ke fungsi RPC di sisi server, yang mengindikasikan masalah pada **database trigger**.

## 2. Analisis Akar Masalah (Final)

Investigasi yang mendalam mengungkapkan dua masalah utama yang saling terkait:

### A. Konflik Kebijakan Row Level Security (RLS)

-   **Diagnosis:** Analisis kebijakan RLS pada tabel `class_exercises` menunjukkan adanya ketidakcocokan antara kebijakan untuk `SELECT` dan `INSERT`.
-   **Implikasi:** Kebijakan `SELECT` yang terlalu kompleks gagal dievaluasi dengan benar dari sisi klien, menyebabkan frontend salah menyimpulkan bahwa tidak ada tugas duplikat. Hal ini menyebabkan upaya `INSERT` yang gagal dan memunculkan error "duplicate key" awal.
-   **Solusi yang Diimplementasikan:** Logika dipindahkan ke fungsi RPC `assign_exercise_to_classes` di sisi server untuk melewati RLS yang bermasalah dan menangani duplikasi secara atomik menggunakan `ON CONFLICT DO NOTHING`.

### B. Database Trigger yang Salah (Penyebab Error Saat Ini)

-   **Diagnosis:** Error `record "new" has no field "student_id"` secara definitif berasal dari sebuah trigger pada tabel `class_exercises`. Trigger ini dieksekusi **setelah** `INSERT` berhasil (atau diabaikan oleh `ON CONFLICT`). Trigger ini secara keliru mencoba mengakses `NEW.student_id`, sebuah kolom yang tidak ada di `class_exercises`.
-   **Investigasi:**
    1.  Fungsi trigger `handle_notification_creation` diidentifikasi sebagai sumber masalah.
    2.  Fungsi tersebut diperbaiki dalam file migrasi (`...remove_link_from_central_notification_trigger.sql`) untuk melakukan iterasi dengan benar pada tabel `class_students` daripada mengakses `NEW.student_id`.
    3.  Meskipun fungsi sudah diperbaiki, error tetap muncul. Ini menunjukkan bahwa trigger di database masih menjalankan **versi lama dari fungsi tersebut yang tersimpan di cache**.
    4.  Sebuah migrasi tambahan (`...force_refresh_assignment_trigger.sql`) dibuat untuk secara eksplisit `DROP` dan `CREATE` ulang trigger, sebuah tindakan yang seharusnya memaksa database untuk menggunakan definisi fungsi yang baru.
-   **Kesimpulan Akhir:** Kegagalan bahkan setelah me-refresh trigger menunjukkan masalah yang sangat persisten dengan keadaan database, di mana perubahan pada fungsi trigger tidak diterapkan seperti yang diharapkan.

## 3. Investigasi & Resolusi Final

Investigasi lebih lanjut pada riwayat migrasi mengungkapkan akar masalah yang sebenarnya.

### Langkah 1: Implementasi Awal (Benar Sebagian)

-   **Aksi:** Migrasi `...115000_disable_faulty_assignment_trigger.sql` dibuat untuk menonaktifkan trigger `on_new_assignment_trigger` yang bermasalah. Ini adalah langkah diagnosis yang benar.
-   **Aksi Berikutnya:** Migrasi `...115500_recreate_assignment_notification_trigger.sql` dibuat untuk menciptakan fungsi (`handle_new_assignment_notification`) dan trigger (`trigger_notify_on_new_assignment`) baru yang benar dan terisolasi.

### Langkah 2: Kesalahan Kritis dalam Migrasi

-   **Masalah:** Di akhir migrasi `...115500_recreate...`, terdapat baris `ALTER TABLE public.class_exercises ENABLE TRIGGER on_new_assignment_trigger;`.
-   **Dampak:** Perintah ini **mengaktifkan kembali trigger lama yang salah**. Akibatnya, setiap kali `INSERT` ke `class_exercises` terjadi, **dua trigger** akan berjalan: satu yang benar dan satu yang salah. Trigger yang salah inilah yang terus menyebabkan transaksi gagal dan memunculkan error.

### Langkah 3: Solusi Definitif (Pembersihan)

-   **Aksi:** Migrasi `...122500_definitively_drop_faulty_trigger.sql` dibuat untuk menyelesaikan masalah ini secara permanen.
-   **Logika:** Migrasi ini secara eksplisit dan permanen **menghapus** trigger `on_new_assignment_trigger` dari database menggunakan perintah `DROP TRIGGER`.
-   **Hasil:** Hanya trigger `trigger_notify_on_new_assignment` yang benar yang tersisa, memastikan logika notifikasi berjalan seperti yang diharapkan tanpa konflik.

## 4. Kesimpulan Akhir

Masalah ini bukan lagi tentang logika yang salah, melainkan tentang **status database yang tidak konsisten** akibat urutan migrasi yang keliru. Solusi yang benar telah ada di dalam kode melalui migrasi `...122500_definitively_drop_faulty_trigger.sql`.

Langkah selanjutnya adalah memastikan semua migrasi telah diterapkan dengan benar di lingkungan database untuk menyinkronkan statusnya dengan kode yang terbaru.
