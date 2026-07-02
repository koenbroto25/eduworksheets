# Studi Kasus: Perbaikan Error pada Laporan Nilai Kelas

**Tanggal:** 20 Juli 2025

## 1. Latar Belakang Masalah

Pengguna (guru) melaporkan adanya error saat mencoba mengakses halaman laporan nilai kelas. Error yang muncul di log backend adalah `Error: column u.full_name does not exist`. Ini mengindikasikan bahwa salah satu query di database mencoba mengakses kolom yang tidak ada.

## 2. Proses Investigasi

### Langkah 1: Analisis Pesan Error
Pesan error `column u.full_name does not exist` secara jelas menunjuk pada query yang salah. Alias `u` biasanya merujuk pada tabel `users`. Hipotesis awal adalah bahwa query tersebut salah menggunakan `full_name` padahal seharusnya nama kolomnya berbeda.

### Langkah 2: Verifikasi Skema Database
Saya memeriksa dokumentasi `cline_docs/table_column_information.md` untuk memverifikasi struktur tabel `users`. Hasilnya mengkonfirmasi bahwa tabel `users` tidak memiliki kolom `full_name`. Kolom yang benar untuk menyimpan nama lengkap pengguna adalah `name`.

### Langkah 3: Identifikasi Sumber Query yang Salah
Berdasarkan konteks "laporan nilai kelas", saya memeriksa `cline_docs/backendContext.md` untuk mengidentifikasi fungsi RPC yang relevan. Fungsi yang paling mungkin menjadi penyebab adalah `get_class_grades_report(p_class_id)`, yang secara spesifik dirancang untuk fitur ini.

### Langkah 4: Pemeriksaan Kode Sumber Fungsi RPC
Saya membaca isi file migrasi yang membuat fungsi tersebut, yaitu `supabase/migrations/20250720130000_create_get_class_grades_report_rpc.sql`. Pemeriksaan ini mengkonfirmasi bahwa di dalam fungsi tersebut, terdapat baris kode:
```sql
SELECT
  ...
  u.full_name AS student_name,
  ...
FROM public.class_assignment_progress cap
...
JOIN public.users u ON cap.student_id = u.id
...
```
Ini adalah sumber pasti dari error tersebut.

## 3. Rencana Perbaikan

Perbaikan yang diperlukan sangat sederhana: mengubah referensi kolom yang salah di dalam fungsi `get_class_grades_report`.

1.  **Modifikasi File Migrasi:** Ubah `u.full_name` menjadi `u.name` di dalam file `supabase/migrations/20250720130000_create_get_class_grades_report_rpc.sql`.
2.  **Terapkan Migrasi:** Jalankan migrasi database agar perubahan pada fungsi RPC diterapkan di lingkungan Supabase.

## 4. Langkah-langkah Implementasi

1.  Gunakan `replace_in_file` untuk mengoreksi nama kolom di file migrasi SQL.
2.  Jalankan perintah `npx supabase db reset` untuk menerapkan ulang semua migrasi, termasuk perbaikan ini.
