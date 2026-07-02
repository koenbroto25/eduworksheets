# Studi Kasus: Investigasi Regresi Error "JSON object requested" di Halaman Detail Kelas

**Tanggal:** 19 Juli 2025
**Penulis:** Cline
**Status:** Selesai

## 1. Ringkasan Eksekutif

Dokumen ini merinci rencana investigasi untuk mengatasi munculnya kembali error kritis `Error: JSON object requested, multiple (or no) rows returned` pada halaman detail kelas (`/class/:id`). Error ini sebelumnya telah diidentifikasi dan diselesaikan dalam kasus `study_case_class_detail_rls_fix.md`, namun telah muncul kembali, yang mengindikasikan adanya regresi fungsional kemungkinan akibat perubahan kode atau migrasi database baru-baru ini.

Dokumen ini menyajikan analisis komprehensif berdasarkan dokumentasi historis, merumuskan hipotesis yang jelas tentang akar masalah, dan menetapkan rencana aksi sistematis untuk mendiagnosis dan menyelesaikan masalah secara permanen.

---

## 2. Deskripsi Masalah & Sejarah

**Masalah yang Dilaporkan:**
Saat mengakses halaman detail kelas (contoh: `http://localhost:5173/class/e93161cb-e437-4c4e-9a2e-2703dc84fc44`), frontend gagal memuat data dan menghasilkan error: `Error: JSON object requested, multiple (or no) rows returned`.

**Konteks Historis:**
Ini adalah masalah yang **berulang**. Error yang sama persis telah diatasi sebelumnya. Solusi historis melibatkan dua perubahan kunci:
1.  **Backend:** Membuat fungsi RPC `get_class_details` yang sengaja disederhanakan untuk **tidak** melakukan `JOIN` ke tabel `users`. Ini dilakukan untuk menghindari konflik dengan kebijakan Row Level Security (RLS) yang kompleks.
2.  **Frontend:** Mengubah logika `ClassDetailPage.tsx` untuk mengadopsi alur dua langkah: pertama memanggil `rpc('get_class_details')`, dan setelah berhasil, melakukan panggilan kedua untuk mengambil profil guru menggunakan `teacher_id` yang diterima.

Munculnya kembali error ini sangat menyiratkan bahwa salah satu dari dua komponen solusi ini telah diubah atau rusak.

---

## 3. Analisis Mendalam & Hipotesis

Berdasarkan studi terhadap `backendContext.md` dan studi kasus sebelumnya (`study_case_class_detail_rls_fix.md`, `study_case_parent_teacher_sync_issue.md`, dan `study_case_student_report_crash.md`), arsitektur yang stabil untuk pengambilan data di proyek ini adalah dengan membungkus query kompleks dalam fungsi RPC yang terisolasi per peran/fitur.

Error `JSON object requested...` hampir selalu merupakan gejala dari panggilan `.single()` di frontend yang gagal karena kebijakan RLS di backend.

**Hipotesis Utama:**
Regresi ini disebabkan oleh penyimpangan dari pola arsitektur yang telah ditetapkan untuk halaman detail kelas. Ada dua kemungkinan utama:

*   **Hipotesis A (Regresi Backend):** Definisi fungsi RPC `get_class_details` di database telah diubah. Mungkin file migrasi baru secara tidak sengaja menambahkan kembali `JOIN` yang sebelumnya dihapus, atau mengubah logika internalnya sehingga tidak lagi menjamin pengembalian satu baris data untuk sebuah `class_id`.

*   **Hipotesis B (Regresi Frontend):** Logika pengambilan data di `src/pages/ClassDetailPage.tsx` telah diubah. Komponen tersebut mungkin tidak lagi menggunakan `rpc('get_class_details')` dan kembali menggunakan metode `supabase.from('classes').select('*, ...')` secara langsung. Panggilan langsung seperti ini sangat rentan terhadap masalah RLS dan merupakan anti-pola dalam arsitektur proyek ini.

---

## 4. Rencana Aksi Sistematis

Untuk mendiagnosis dan memperbaiki masalah ini secara efisien dan permanen, saya akan menjalankan rencana berikut. Saya akan mendokumentasikan temuan di setiap langkah.

### Fase 1: Verifikasi Logika Frontend (Konsumen Data)

Tujuan dari fase ini adalah untuk memahami bagaimana data diminta oleh klien, yang akan mengkonfirmasi atau menyangkal **Hipotesis B**.

*   **Langkah 1.1:** Baca konten file `src/pages/ClassDetailPage.tsx`.
*   **Langkah 1.2:** Analisis `useEffect` atau hook data (seperti `useQuery`) yang bertanggung jawab untuk mengambil detail kelas.
*   **Langkah 1.3:** Identifikasi dengan pasti fungsi `supabaseService` yang dipanggil. Apakah itu memanggil `rpc('get_class_details')` seperti yang diharapkan, atau melakukan `from('classes').select(...)`?
*   **Langkah 1.4:** Dokumentasikan temuan.

**Temuan Fase 1:**
**Hipotesis B (Regresi Frontend) sebagian besar salah.** Kode di `ClassDetailPage.tsx` *memang* memanggil `supabaseService.getClassDetails`, tetapi melakukannya dengan asumsi yang salah bahwa fungsi tersebut akan mengembalikan objek gabungan yang kompleks (termasuk nama guru dan daftar siswa). Ini adalah penyimpangan dari pola stabil yang sebelumnya diimplementasikan, di mana frontend seharusnya melakukan beberapa panggilan terpisah. Kesalahan ini di frontend mendorong perubahan yang salah di backend.

### Fase 2: Verifikasi Logika Backend (Sumber Data)

Tujuan dari fase ini adalah untuk memeriksa implementasi aktual dari fungsi yang dipanggil oleh frontend, yang akan mengkonfirmasi atau menyangkal **Hipotesis A**.

*   **Langkah 2.1:** Berdasarkan temuan dari Fase 1, identifikasi nama fungsi RPC yang relevan (kemungkinan besar `get_class_details`).
*   **Langkah 2.2:** Gunakan `search_files` untuk menemukan file migrasi SQL terbaru yang mendefinisikan atau mengubah fungsi RPC tersebut di dalam direktori `supabase/migrations/`.
*   **Langkah 2.3:** Baca konten file migrasi yang ditemukan.
*   **Langkah 2.4:** Analisis kode SQL dari fungsi tersebut. Apakah ada `JOIN` yang tidak terduga? Apakah logikanya menjamin pengembalian satu baris?
*   **Langkah 2.5:** Dokumentasikan temuan.

**Temuan Fase 2:**
**Hipotesis A (Regresi Backend) terkonfirmasi.** Ditemukan file migrasi `20250718210000_add_students_to_get_class_details_rpc.sql` yang mengubah fungsi `get_class_details`. Perubahan ini menambahkan `JOIN` ke tabel `users` dan subquery yang kompleks untuk menyatukan semua data dalam satu panggilan. Perubahan ini, meskipun dimaksudkan untuk menyederhanakan frontend, secara langsung menyebabkan konflik RLS yang mengakibatkan fungsi tidak mengembalikan baris apa pun, yang memicu error `.single()` di `supabaseService`.

### Fase 3: Implementasi Perbaikan

Berdasarkan temuan bahwa baik backend maupun frontend telah menyimpang dari pola yang stabil, solusi gabungan diimplementasikan.

*   **Perbaikan Backend:**
    *   **Langkah 3.1:** Membuat file migrasi `...revert_get_class_details_rpc.sql` untuk mengembalikan fungsi ke versi sederhana tanpa `JOIN`.
    *   **Langkah 3.2:** Setelah error `structure of query does not match function result type` muncul, dibuat file migrasi final `...realign_get_class_details_rpc_schema.sql`. Migrasi ini menyelaraskan tipe data `RETURNS TABLE` dengan skema tabel `classes` yang sebenarnya (termasuk `student_count`) berdasarkan data `information_schema` yang diberikan. Ini adalah perbaikan definitif di sisi backend.

*   **Perbaikan Frontend:**
    *   **Langkah 3.3:** Memperbaiki `src/services/supabaseService.ts` dengan menghapus modifier `.single()` dari pemanggilan `rpc('get_class_details')`.
    *   **Langkah 3.4:** Memperbaiki komponen `src/pages/ClassDetailPage.tsx`. Logika `fetchClassData` ditulis ulang untuk mengadopsi alur pengambilan data asinkron yang benar dan terpisah:
        1.  Memanggil `get_class_details` untuk mendapatkan detail kelas dasar.
        2.  Setelah berhasil, memanggil `getUserProfile` untuk mendapatkan detail guru.
        3.  Memanggil `getClassStudents` untuk mendapatkan daftar siswa.
        4.  Memanggil `getClassExercises` untuk mendapatkan daftar tugas.

### Fase 4: Verifikasi & Penutupan

*   **Langkah 4.1: Verifikasi:** Pengguna dapat memverifikasi perbaikan dengan me-refresh halaman detail kelas di `http://localhost:5173/class/e93161cb-e437-4c4e-9a2e-2703dc84fc44`. Halaman sekarang seharusnya dimuat dengan benar tanpa error, menampilkan nama kelas, nama guru, daftar siswa, dan daftar latihan.

*   **Langkah 4.2: Pelajaran yang Diambil:**
    *   **Pentingnya Kepatuhan Arsitektur:** Regresi ini terjadi karena penyimpangan dari pola arsitektur yang telah terbukti berhasil. Upaya untuk menyederhanakan satu lapisan (frontend) dengan mengorbankan stabilitas lapisan lain (backend) menyebabkan kegagalan sistem.
    *   **Dokumentasi sebagai Pertahanan:** Adanya dokumentasi yang jelas dari kasus sebelumnya (`study_case_class_detail_rls_fix.md`) sangat penting untuk mendiagnosis regresi ini dengan cepat dan akurat.
    *   **RPC Terisolasi:** Pola penggunaan fungsi RPC yang kecil, terisolasi, dan spesifik untuk setiap kebutuhan data tetap menjadi pendekatan yang paling kuat untuk menghindari konflik RLS yang kompleks.
    *   **Kebenaran Skema:** Error `structure of query does not match function result type` menyoroti pentingnya memastikan bahwa definisi `RETURNS TABLE` dalam fungsi PostgreSQL benar-benar cocok dengan skema tabel yang mendasarinya, baik dalam urutan kolom maupun tipe data.
