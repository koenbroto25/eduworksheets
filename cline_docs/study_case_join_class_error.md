# Studi Kasus: Error Saat Siswa Bergabung dengan Kelas

Dokumen ini menganalisis dan merinci perbaikan untuk bug kritis di mana siswa tidak dapat mencari atau bergabung dengan kelas baru.

**Status: Terpecahkan**

## 1. Laporan Masalah

**Tanggal:** 23 Juli 2025
**Fitur:** Gabung Kelas Baru (Join Class)
**Laporan Pengguna:** Siswa yang mencoba mencari kelas menggunakan kode kelas di dasbor siswa menerima error.
**Pesan Error Awal:** `Could not find the function public.find_by_code(p_code) in the schema cache`
**Pesan Error Saat Ini:** `Code not found.`

## 2. Analisis Teknis & Investigasi

- **Akar Masalah Awal:** Investigasi awal menunjukkan bahwa komponen frontend `JoinClassWidget.tsx` memanggil fungsi RPC `find_by_code` yang tidak ada di database.
- **Iterasi Perbaikan 1: Pembuatan RPC**: Sebuah fungsi RPC `find_by_code` dibuat melalui migrasi. Namun, ini menghasilkan error baru: `Code not found.`.
- **Iterasi Perbaikan 2: Penanganan RLS**: Awalnya, dicurigai bahwa *Row Level Security* (RLS) pada tabel `classes` memblokir fungsi untuk menemukan kelas di mana siswa belum menjadi anggota. Pengguna mengkonfirmasi bahwa RLS telah dinonaktifkan untuk sementara waktu untuk tujuan debugging, sehingga ini dikesampingkan sebagai penyebab utama.
- **Iterasi Perbaikan 3: Sensitivitas Huruf & Spasi**: Fungsi RPC disempurnakan untuk menangani perbandingan *case-insensitive* (menggunakan `UPPER`) dan untuk menghapus spasi tersembunyi (menggunakan `TRIM`). Meskipun praktik ini baik, error `Code not found.` tetap berlanjut.
- **Iterasi Perbaikan 4: Logika Pengembalian RPC**: Fungsi RPC dimodifikasi lebih lanjut untuk memastikan ia mengembalikan hasil yang benar bahkan jika tidak ada baris yang ditemukan, untuk menghindari `NULL` yang diinterpretasikan salah oleh frontend. Ini juga tidak menyelesaikan masalah.

## 3. Solusi Final

Setelah analisis lebih lanjut, akar masalah yang sebenarnya berhasil diidentifikasi.

- **Akar Masalah Definitif:** Masalah ini disebabkan oleh dua faktor yang saling terkait:
    1.  **Masalah Hak Akses (RLS):** Fungsi RPC `find_by_code` pada awalnya tidak memiliki `SECURITY DEFINER`. Ini berarti fungsi tersebut dijalankan dengan hak akses pengguna (siswa), yang karena kebijakan RLS, tidak dapat melihat kelas yang belum mereka ikuti.
    2.  **Masalah Penanganan Error di Frontend:** Setelah `SECURITY DEFINER` ditambahkan, error tetap ada. Investigasi lebih lanjut menemukan bahwa `supabaseService.ts` menggunakan metode `.single()` pada pemanggilan RPC. Metode ini secara spesifik akan gagal jika tidak ada satu baris pun yang dikembalikan, yang kemudian diinterpretasikan sebagai error "Code not found." oleh logika frontend.

- **Implementasi Perbaikan:**
  1.  **Modifikasi Fungsi RPC:** Properti `SECURITY DEFINER` ditambahkan ke fungsi `find_by_code` di file migrasi `supabase/migrations/20250723102300_create_find_by_code_rpc.sql` untuk mengatasi masalah hak akses.
  2.  **Refactor Layanan Frontend:** Fungsi `findByCode` di `src/services/supabaseService.ts` diubah. Panggilan `.single()` dihapus dan diganti dengan logika yang secara eksplisit memeriksa apakah array hasil yang dikembalikan kosong. Ini membuat penanganan kasus "tidak ditemukan" menjadi lebih andal.
  3.  **Penerapan Migrasi & Kode:** Migrasi database diterapkan dan kode frontend yang diperbarui di-deploy.

## 4. Hasil

Dengan `SECURITY DEFINER` diterapkan, fungsi `find_by_code` sekarang dapat mencari semua kelas berdasarkan kode, dan fitur "Gabung Kelas" berfungsi seperti yang diharapkan.
