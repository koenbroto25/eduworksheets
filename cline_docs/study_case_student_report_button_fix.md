# Studi Kasus: Fungsionalitas Tombol "Lihat Rapor Lengkap" di Dasbor Siswa

- **Status**: `Paused`
- **Tujuan**: Mengimplementasikan fungsionalitas penuh untuk tombol "Lihat Rapor Lengkap" dan memperbaiki regresi data pada dasbor siswa.

## Ringkasan Masalah

Tugas ini awalnya bertujuan untuk mengaktifkan tombol "Lihat Rapor Lengkap" di dasbor siswa. Namun, selama implementasi, terjadi regresi yang menyebabkan hilangnya data "Tugas Aktif" dan "Nilai Terbaru". Fokus tugas kemudian beralih untuk memperbaiki regresi ini terlebih dahulu.

## Gejala Awal

1.  Tombol "Lihat Rapor Lengkap" pada `ProgressWidget` tidak berfungsi.
2.  (Setelah implementasi awal) Widget `AssignmentsWidget` dan `ProgressWidget` menjadi kosong, tidak menampilkan data apa pun.

## Investigasi & Resolusi

1.  **Akar Masalah Awal:** Tombol tidak berfungsi karena logika frontend-nya belum diimplementasikan. Backend RPC (`get_student_class_report`) sudah tersedia.
2.  **Implementasi Awal:**
    *   Membuat halaman `StudentReportPage.tsx` dan `ChildReportPage.tsx`.
    *   Menambahkan rute baru di `router/index.tsx`.
    *   Menambahkan tipe data `StudentReport` di `types/index.ts`.
    *   Untuk mendapatkan `class_id` yang diperlukan untuk tombol rapor, fungsi `getStudentDashboardData` di `supabaseService.ts` dimodifikasi untuk melakukan join dengan tabel `classes`.
3.  **Identifikasi Regresi:** Modifikasi pada `getStudentDashboardData` menyebabkan masalah. Query Supabase secara efektif melakukan `INNER JOIN`, yang berarti setiap tugas atau nilai yang **tidak** memiliki `class_id` (misalnya, tugas dari orang tua) menjadi tersaring dan tidak ikut terambil. Ini menyebabkan widget di dasbor menjadi kosong.
4.  **Resolusi Regresi:**
    *   Perubahan pada `getStudentDashboardData` dikembalikan seperti semula untuk memastikan semua data tugas dan nilai (baik dari kelas maupun non-kelas) dapat diambil dengan benar.
    *   Komponen `ProgressWidget.tsx` diperbarui untuk menangani kasus di mana data nilai mungkin tidak memiliki informasi kelas. Tombol "Lihat Rapor Lengkap" sekarang dinonaktifkan secara dinamis jika tidak ada nilai berbasis kelas yang tersedia untuk ditampilkan.

## Status Saat Ini

*   **Regresi Teratasi:** Dasbor siswa sekarang menampilkan kembali semua tugas aktif dan nilai terbaru dengan benar.
*   **Fungsionalitas Tombol Rapor:** Fungsionalitas dasar tombol telah diimplementasikan, tetapi bergantung pada ketersediaan data nilai yang terkait dengan kelas. Implementasi ini dianggap belum selesai dan menunggu instruksi lebih lanjut untuk penyempurnaan.

## Langkah Selanjutnya

*   Menunggu instruksi lebih lanjut untuk menyelesaikan atau menyempurnakan logika tombol "Lihat Rapor Lengkap". Kemungkinan perlu dipertimbangkan cara untuk menampilkan laporan gabungan atau memungkinkan pengguna memilih laporan kelas mana yang ingin dilihat.
