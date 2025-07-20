# Studi Kasus 12: Perbaikan Error Kritis `supabase.from is not a function` pada Halaman Laporan Siswa

- **Status**: `Tested`
- **Gejala Awal**: Halaman laporan siswa (`/class/:id/student-reports`) mengalami crash. Awalnya, error yang muncul adalah `supabase.from is not a function`. Setelah perbaikan awal, error berubah menjadi `Could not find a relationship between 'class_students' and 'exercise_attempts'`.
- **Investigasi**:
    - **Analisis Error Pertama (`supabase.from`)**: Ditemukan bahwa komponen `StudentReports.tsx` tidak meneruskan *instance* Supabase client ke `supabaseService`, sesuai dengan pola bug yang pernah terjadi sebelumnya.
    - **Analisis Error Kedua (`relationship not found`)**: Setelah memperbaiki error pertama, error baru menunjukkan bahwa query client-side di `supabaseService` terlalu kompleks. Query tersebut mencoba membuat relasi antara `class_students` dan `exercise_attempts` yang tidak dapat diselesaikan secara otomatis oleh Supabase.
    - **Akar Masalah**: Akar masalahnya adalah query yang tidak efisien dan tidak sesuai dengan arsitektur yang ada. Pola yang benar dalam proyek ini adalah dengan memindahkan logika query yang kompleks ke dalam fungsi RPC di database.
- **Rencana Solusi (Final)**:
    1.  **Buat Fungsi RPC**: Membuat fungsi PostgreSQL baru, `get_class_student_reports(p_class_id)`, yang secara aman dan efisien menggabungkan data dari `class_students`, `users`, dan `exercise_attempts`. Fungsi ini dienkapsulasi dalam sebuah file migrasi baru.
    2.  **Perbarui Service Layer**: Memodifikasi fungsi `getStudentReports` di `supabaseService.ts` untuk memanggil fungsi RPC `get_class_student_reports` yang baru, menggantikan query client-side yang lama.
    3.  **Sesuaikan Komponen**: Memperbarui komponen `StudentReports.tsx` untuk mencocokkan struktur data yang dikembalikan oleh fungsi RPC yang baru (menggunakan `student_name` daripada `student.name`).
    4.  **Perbarui Dokumentasi**: Menambahkan dokumentasi untuk fungsi RPC yang baru di `backendContext.md`.
- **Hasil**: Semua error berhasil diatasi. Halaman laporan siswa sekarang berfungsi dengan baik, menggunakan metode pengambilan data yang efisien dan aman sesuai dengan pola arsitektur proyek.
