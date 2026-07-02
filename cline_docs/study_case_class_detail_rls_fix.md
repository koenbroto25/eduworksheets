# Studi Kasus: Perbaikan Bug RLS dan Frontend Fetching Halaman Detail Kelas

**Tanggal:** 18 Juli 2025
**Penulis:** Cline
**Status:** Selesai

## 1. Ringkasan Eksekutif

Dokumen ini merinci proses debugging dan perbaikan serangkaian bug yang saling terkait yang mencegah halaman detail kelas dimuat dengan benar. Masalah awal adalah error rekursi tak terbatas pada kebijakan Row Level Security (RLS), yang kemudian berkembang menjadi serangkaian masalah baik di backend maupun frontend.

Dokumen ini menguraikan setiap langkah dari proses investigasi, hipotesis yang salah, dan solusi akhir yang diimplementasikan, yang melibatkan baik migrasi database maupun refaktorisasi frontend.

---

## 2. Masalah Awal & Gejala

Saat mengakses halaman detail kelas, pengguna dihadapkan pada serangkaian error yang berbeda, dimulai dengan:

1.  `Error: infinite recursion detected in policy for relation "classes"`
2.  Setelah perbaikan awal, error berubah menjadi `relation "public.class_members" does not exist`
3.  Setelah perbaikan lebih lanjut, error terakhir adalah `Error: JSON object requested, multiple (or no) rows returned`

Rangkaian error ini menunjukkan masalah yang kompleks yang melibatkan RLS, skema database, dan logika pengambilan data di frontend.

---

## 3. Proses Debugging & Solusi (Iteratif)

Proses untuk mencapai solusi akhir bersifat iteratif, dengan setiap perbaikan mengungkap lapisan masalah berikutnya.

### Iterasi 1: Analisis Awal & Percobaan Perbaikan RLS
*   **Masalah:** `infinite recursion detected in policy for relation "classes"`.
*   **Hipotesis:** Berdasarkan kasus sebelumnya, RLS pada tabel `classes` kemungkinan besar menyebabkan siklus ketergantungan.
*   **Tindakan:** Membuat migrasi untuk mendefinisikan fungsi helper `is_class_member` dan membuat kebijakan RLS baru yang terkonsolidasi untuk `SELECT` pada tabel `classes`.
*   **Hasil:** Gagal. Migrasi manual oleh pengguna mengungkap error baru: `ERROR: 42883: function get_my_claim(text) does not exist`. Ini menunjukkan bahwa kebijakan RLS yang ada bergantung pada fungsi helper yang tidak terdefinisi.

### Iterasi 2: Konsolidasi RLS & Penambahan Fungsi Helper
*   **Masalah:** Ketergantungan pada fungsi yang tidak ada dan adanya beberapa kebijakan `SELECT` yang tumpang tindih pada tabel `classes`, yang merupakan praktik buruk.
*   **Hipotesis:** Perlu membuat fungsi helper `get_user_role` yang valid dan menyatukan semua kebijakan `SELECT` menjadi satu kebijakan yang komprehensif.
*   **Tindakan:** Membuat migrasi `20250718203000_create_helpers_and_fix_class_rls.sql` yang:
    1.  Membuat fungsi `get_user_role()`.
    2.  Menghapus semua kebijakan `SELECT` yang lama dan berkonflik.
    3.  Membuat satu kebijakan `SELECT` tunggal yang menangani guru dan siswa.
*   **Hasil:** Gagal. Pengguna melaporkan error baru setelah migrasi: `Error: relation "public.class_members" does not exist`.

### Iterasi 3: Koreksi Skema pada Fungsi Helper
*   **Masalah:** Fungsi `is_class_member` yang baru dibuat merujuk ke tabel `class_members` yang tidak ada.
*   **Hipotesis:** Berdasarkan file `backendContext.md` dan migrasi sebelumnya, nama tabel yang benar adalah `class_students`.
*   **Tindakan:** Membuat migrasi `20250718203500_correct_is_class_member_function.sql` untuk memperbaiki nama tabel dari `class_members` menjadi `class_students` di dalam fungsi `is_class_member`.
*   **Hasil:** Error database teratasi. Namun, error baru muncul di frontend: `Error: JSON object requested, multiple (or no) rows returned`.

### Iterasi 4: Diagnosis Error Frontend & Pembuatan RPC
*   **Masalah:** Panggilan Supabase di frontend yang menggunakan `.single()` gagal karena query mengembalikan 0 atau lebih dari 1 baris.
*   **Hipotesis:** Meskipun RLS `classes` sudah benar, query dari frontend (kemungkinan dengan `JOIN`) masih diblokir oleh RLS dari tabel lain, sehingga tidak ada baris yang dikembalikan.
*   **Tindakan:** Mengikuti pola yang ada (`get_my_classes`), dibuatlah fungsi RPC baru `get_class_details` dengan `SECURITY DEFINER` untuk mengambil semua detail kelas dalam satu panggilan, termasuk `JOIN` ke tabel `users` untuk mendapatkan nama guru.
*   **Hasil:** Error tetap ada. Hipotesis disempurnakan: `SECURITY DEFINER` pada fungsi tidak dapat melewati RLS pada tabel yang di-`JOIN` (`users`), di mana kebijakan RLS hanya mengizinkan pengguna untuk melihat data mereka sendiri.

---

## 4. Solusi Akhir yang Diimplementasikan

Solusi akhir memisahkan tanggung jawab antara backend dan frontend untuk menghindari konflik RLS yang kompleks.

### 4.1. Perubahan Backend
1.  **RPC yang Disederhanakan:** Migrasi `20250718205000_simplify_get_class_details_rpc.sql` dibuat untuk memodifikasi fungsi `get_class_details`.
    *   `JOIN` ke tabel `users` dihapus sepenuhnya.
    *   Fungsi ini sekarang hanya bertanggung jawab untuk mengambil data dari tabel `classes` dan menghitung jumlah siswa.
    *   Properti `SECURITY DEFINER` dipertahankan untuk memastikan fungsi dapat melewati RLS pada tabel `classes` itu sendiri.

### 4.2. Perubahan Frontend
1.  **Pemisahan Pengambilan Data:** Logika di `ClassDetailPage.tsx` diubah secara signifikan.
    *   **Panggilan Pertama:** Memanggil `rpc('get_class_details')` untuk mendapatkan detail inti kelas.
    *   **Panggilan Kedua:** Setelah panggilan pertama berhasil, `teacher_id` yang diterima digunakan untuk melakukan panggilan kedua ke `supabaseService.getUserProfile` untuk mengambil detail guru secara terpisah.
2.  **Manajemen State:** State baru, `teacher`, ditambahkan ke komponen `ClassDetailPage` untuk menyimpan profil guru yang diambil dari panggilan kedua.
3.  **Pembaruan Tipe:** Interface `Class` di `src/types/index.ts` diperbarui untuk menghapus `teacher_name`, karena data ini sekarang dikelola dalam state `teacher` yang terpisah.
4.  **Pembaruan UI:** Komponen di-update untuk menampilkan `teacher.name` dari state yang baru.

---

## 5. Pelajaran yang Diambil

*   **`SECURITY DEFINER` dan `JOIN`:** Sebuah fungsi `SECURITY DEFINER` tidak secara otomatis memberikan hak akses super ke tabel yang di-`JOIN`. Kebijakan RLS pada tabel yang di-`JOIN` tetap dievaluasi, yang dapat menyebabkan kegagalan tak terduga.
*   **Pemisahan Tanggung Jawab:** Untuk arsitektur yang aman dan dapat dipelihara dengan RLS, seringkali lebih baik untuk memisahkan panggilan data di frontend daripada membuat `JOIN` yang kompleks dan berisiko di backend, terutama saat menggunakan `SECURITY DEFINER`.
*   **Debugging Iteratif:** Rangkaian error ini menunjukkan pentingnya proses debugging yang metodis. Setiap pesan error, meskipun merupakan sebuah kemunduran, memberikan petunjuk penting yang membantu menyempurnakan pemahaman tentang akar masalah.
