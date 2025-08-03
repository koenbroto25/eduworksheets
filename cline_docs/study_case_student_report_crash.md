# Studi Kasus 12 (Diperbarui): Perbaikan Crash Berulang dan Refactor Layanan Supabase

- __Status__: `In Progress`

- __Gejala Awal__: Halaman laporan siswa (`StudentReportPage.tsx`) dan laporan anak (`ChildReportPage.tsx`) mengalami crash secara konsisten dengan error `TypeError: Cannot read properties of undefined (reading 'map')`. Error ini tetap muncul meskipun beberapa perbaikan pada backend (RPC) telah dilakukan.

- __Investigasi__:

  - __Analisis Awal__: Error `map` menunjukkan bahwa `report.assignments` bernilai `undefined` saat komponen mencoba untuk me-render daftar tugas. Upaya awal difokuskan pada perbaikan RPC `get_student_class_report` untuk memastikan ia selalu mengembalikan array `assignments`, bahkan jika kosong.

  - __Debugging Lanjutan__: Meskipun RPC sudah diperbaiki dengan `COALESCE` dan panggilan layanan menggunakan `.single()`, error tetap ada. Ini menunjukkan masalahnya ada di frontend. `console.log` yang ditambahkan menunjukkan bahwa objek `report` yang diterima terkadang tidak memiliki properti `assignments`.

  - __Masalah Tambahan__: Selama proses debugging, file `src/services/supabaseService.ts` menjadi rusak karena metadata yang tidak disengaja, menyebabkan banyak sekali error TypeScript yang tidak terkait dan menghentikan proses development.

  - __Akar Masalah__:

    1. __Penanganan Data yang Tidak Aman__: Komponen frontend tidak secara defensif memeriksa keberadaan `report.assignments` sebelum mencoba melakukan iterasi, menyebabkan crash saat data tidak lengkap.
    2. __Kerusakan File__: File `supabaseService.ts` rusak, menunjukkan adanya masalah dalam proses penulisan file.
    3. __Kompleksitas Layanan__: File `supabaseService.ts` yang monolitik telah menjadi terlalu besar dan sulit dikelola, meningkatkan risiko error dan membuat debugging menjadi sulit.

- __Rencana Solusi (Final)__:

  1. __Perbaikan Stabilitas UI (Jangka Pendek)__:

     - Menambahkan pemeriksaan keamanan (`report && report.assignments && ...`) di `StudentReportPage.tsx` dan `ChildReportPage.tsx` untuk mencegah crash.
     - Menambahkan penegasan tipe (`as StudentReport`) untuk mengatasi error TypeScript saat mengatur state.

  2. __Pembersihan dan Refactor `supabaseService.ts` (Jangka Panjang)__:

     - __Bersihkan File__: Menimpa `supabaseService.ts` dengan versi yang bersih untuk menghilangkan semua error TypeScript yang disebabkan oleh kerusakan.
     - __Refactor Layanan__: Memecah `supabaseService.ts` menjadi beberapa file layanan yang lebih kecil dan fokus berdasarkan domain (misalnya, `authService.ts`, `exerciseService.ts`, `classService.ts`, `reportService.ts`, dll.).
     - __Perbarui Impor__: Memperbarui semua impor di seluruh aplikasi untuk menggunakan file layanan yang baru.

- __Hasil yang Diharapkan__:

  - Halaman laporan akan menjadi stabil dan tidak lagi crash.
  - Codebase akan menjadi lebih bersih, lebih mudah dipelihara, dan lebih mudah untuk di-debug di masa depan.
  - Risiko error serupa yang terjadi lagi akan berkurang secara signifikan.
