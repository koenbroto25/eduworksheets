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

## 3. Rencana Solusi Definitif (Revisi Final)

Karena semua upaya untuk memperbaiki dan me-refresh trigger yang ada telah gagal, pendekatan yang paling aman dan dijamin berhasil adalah dengan **mengisolasi dan mengganti sepenuhnya logika yang bermasalah**.

### Langkah 1: Nonaktifkan Trigger yang Bermasalah (Isolasi)

Langkah pertama adalah membuktikan secara definitif bahwa `on_new_assignment_trigger` adalah sumber error. Kita akan menonaktifkannya sementara.

-   **Aksi:** Membuat file migrasi baru yang hanya berisi perintah: `ALTER TABLE public.class_exercises DISABLE TRIGGER on_new_assignment_trigger;`.
-   **Tujuan:** Jika penugasan berhasil setelah ini, maka kita 100% yakin bahwa trigger tersebut adalah penyebabnya. Notifikasi untuk sementara tidak akan berfungsi, tetapi error akan hilang.

### Langkah 2: Membuat Fungsi & Trigger Notifikasi yang Baru dan Terisolasi (Penggantian)

Daripada mencoba memperbaiki fungsi `handle_notification_creation` yang kompleks dan digunakan bersama, kita akan membuat fungsi dan trigger baru yang didedikasikan **hanya** untuk penugasan latihan.

-   **Nama Fungsi Baru:** `handle_new_assignment_notification`
-   **Logika:** Fungsi ini akan berisi **hanya** logika yang diperlukan untuk menangani notifikasi penugasan baru. Ia akan mengambil `NEW.class_id`, mencari semua `student_id` di `class_students`, dan membuat notifikasi yang sesuai. Fungsi ini akan ramping dan mudah diverifikasi.
-   **Nama Trigger Baru:** `trigger_notify_on_new_assignment`
-   **Aksi:** Membuat file migrasi baru untuk membuat fungsi dan trigger baru ini, yang akan dipasang pada `AFTER INSERT ON public.class_exercises`.

### Langkah 3: Membersihkan Trigger Lama (Opsional, Direkomendasikan)

Setelah fungsi dan trigger baru terbukti berfungsi, kita dapat dengan aman menghapus trigger `on_new_assignment_trigger` yang lama dari fungsi `handle_notification_creation` untuk menghindari kebingungan di masa depan.

## 4. Hasil Akhir yang Diharapkan

-   **Error Teratasi:** Dengan menonaktifkan trigger yang lama dan menggantinya dengan yang baru dan terisolasi, error `record "new" has no field "student_id"` akan hilang secara definitif.
-   **Fungsionalitas Kembali:** Notifikasi untuk tugas baru akan berfungsi kembali seperti yang diharapkan.
-   **Kode yang Lebih Baik:** Memisahkan logika notifikasi ke dalam fungsi-fungsi yang lebih kecil dan terfokus adalah praktik terbaik yang membuat sistem lebih mudah dipelihara dan di-debug di masa depan.
