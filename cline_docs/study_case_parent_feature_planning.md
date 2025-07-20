# Studi Kasus 10: Perencanaan Final dan Presisi untuk Fitur Orang Tua

Dokumen ini adalah peta jalan definitif untuk implementasi fitur Orang Tua, yang telah divalidasi sepenuhnya terhadap skema database dan arsitektur sistem yang ada. Rencana ini menggabungkan analisis mendalam untuk memastikan eksekusi yang presisi.

## 1. Latar Belakang dan Tujuan

Berdasarkan `productContext.md`, fitur Orang Tua bertujuan untuk memberdayakan orang tua sebagai mitra aktif dalam pendidikan anak dengan menyediakan:
- Dasbor pemantauan cerdas.
- Kemampuan untuk memberikan latihan tambahan.
- Wawasan yang dapat ditindaklanjuti mengenai kemajuan belajar anak.

## 2. Analisis Skema dan Penyesuaian Kunci

Analisis skema database yang ada menghasilkan beberapa penyesuaian penting dari rencana awal, yang menjadi dasar dari rencana final ini:

1.  **Tabel Keanggotaan Kelas**: Validasi mengonfirmasi bahwa tabel yang benar untuk keanggotaan siswa di kelas adalah `public.class_students`, bukan `class_members`. Penyesuaian ini krusial untuk logika pengambilan tugas yang diberikan oleh guru.
2.  **Sumber Status Lulus/Gagal**: Ditemukan bahwa kolom `status` (yang melacak `completed_passed`/`completed_failed`) berada di tabel `public.user_progress`, bukan di `public.exercise_attempts`. Ini adalah temuan kunci yang memengaruhi cara dasbor dan laporan menampilkan status ringkas.
3.  **Nama Kolom Pengguna**: Kolom untuk nama lengkap pengguna adalah `name`, bukan `full_name`. Rencana ini telah diperbarui untuk menggunakan nomenklatur yang benar secara konsisten.

## 3. Rencana Final dan Presisi

Ini adalah rencana definitif yang telah divalidasi sepenuhnya.

---

### **Fase 1: Fondasi Penautan yang Andal & Dasbor Cerdas**

Fase ini berfokus pada pembuatan mekanisme inti yang menghubungkan orang tua dengan anak dan menyajikan data ringkasan yang paling relevan.

**1. Implementasi Alur "Tautkan Anak dengan Kode"**

-   **Tugas:** Membuat alur kerja penuh bagi orang tua untuk menautkan akun mereka ke akun anak menggunakan kode unik.
-   **Detail Teknis:**
    -   **Frontend:** Halaman `LinkChildPage.tsx` akan berisi form input untuk kode anak. Saat disubmit, halaman ini akan memanggil fungsi RPC `find_child_by_code`.
    -   **Backend (RPC Function):**
        -   Membuat fungsi RPC `find_child_by_code(code TEXT)` dengan `SECURITY DEFINER`. Penggunaan `SECURITY DEFINER` sangat penting (sesuai pelajaran dari `study_case_find_by_code.md`) untuk melewati RLS sementara dan mencari pengguna di seluruh tabel.
        -   Logika fungsi: `SELECT id, name, avatar_url FROM public.users WHERE child_code = code AND role = 'student' LIMIT 1;`
    -   **Konfirmasi Pengguna:** Jika anak ditemukan, UI akan menampilkan `name` dan `avatar_url` anak sebagai langkah konfirmasi visual bagi orang tua.
    -   **Penautan Final:** Setelah orang tua mengonfirmasi, fungsi RPC kedua, `link_parent_to_child(parent_id UUID, child_id UUID)`, akan dipanggil. Fungsi ini akan menjalankan `INSERT` ke dalam tabel `public.parent_child_link` untuk meresmikan hubungan.

**2. Implementasi `ChildCard` di Dasbor Orang Tua**

-   **Tugas:** Setelah anak tertaut, dasbor orang tua (`ParentDashboard.tsx`) akan menampilkan komponen `ChildCard` yang berisi ringkasan progres anak.
-   **Detail Teknis Pengambilan Data (per anak):**
    1.  Ambil data dasar anak: `name` dan `avatar_url` dari `public.users` menggunakan `child_id`.
    2.  Ambil tugas dari orang tua: `SELECT exercise_id FROM public.parent_assignments WHERE child_id = {child_id}`.
    3.  Ambil `class_id` anak: `SELECT class_id FROM public.class_students WHERE student_id = {child_id}`.
    4.  Ambil tugas dari guru: Menggunakan `class_id` dari langkah sebelumnya, jalankan `SELECT exercise_id FROM public.class_exercises WHERE class_id IN (...)`.
    5.  Gabungkan kedua daftar `exercise_id` tersebut menjadi satu daftar tugas yang unik.
    6.  **Ambil Status Progres Terakhir:** Untuk setiap `exercise_id` dalam daftar gabungan, ambil status terakhir dari `public.user_progress` dengan query: `SELECT status FROM public.user_progress WHERE user_id = {child_id} AND exercise_id = {exercise_id} ORDER BY created_at DESC LIMIT 1;`.
    7.  **Tampilan UI:** Kolom `status` (`completed_passed`, `completed_failed`, atau null) dari `user_progress` akan digunakan untuk menampilkan ikon Lulus/Gagal/Belum Dikerjakan di `ChildCard`.

---

### **Fase 2: Laporan Mendalam dan Pemberdayaan Orang Tua**

Fase ini membangun di atas fondasi Fase 1 untuk memberikan laporan yang lebih detail dan alat bagi orang tua untuk bertindak.

**1. Pengembangan Halaman Detail Laporan Anak**

-   **Tugas:** Membuat halaman laporan kinerja anak yang komprehensif, dapat diakses dengan mengklik `ChildCard`.
-   **Detail Teknis:**
    -   Membuat fungsi `getChildPerformanceDetails(child_id)` di `supabaseService.ts`.
    -   Fungsi ini akan menjadi pusat agregasi data dan melakukan query berikut:
        -   Mengambil semua tugas yang pernah diberikan (menggabungkan dari `parent_assignments` dan `class_exercises` seperti pada Fase 1).
        -   Untuk setiap tugas, mengambil semua riwayat percobaan dari `public.exercise_attempts` (untuk melihat skor, jawaban, dan waktu setiap percobaan).
        -   Untuk setiap tugas, mengambil status akhir (Lulus/Gagal/Belum Dikerjakan) dari `public.user_progress`.
    -   **UI Laporan:** Halaman akan menampilkan data ini dalam bentuk tabel yang dapat diurutkan dan mungkin beberapa grafik tren kinerja sederhana (misalnya, skor rata-rata dari waktu ke waktu).

**2. Implementasi Fitur "Beri Latihan Soal" (Revisi)**

### Rencana Implementasi: Tombol "Tugaskan ke Anak" pada Exercise Card

__Tujuan:__ Memungkinkan orang tua untuk menugaskan latihan langsung dari `ExerciseCard` di halaman perpustakaan (`/library`) kepada satu atau lebih anak mereka.

---

#### __Langkah 1: Analisis & Persiapan Komponen__

Sebelum menulis kode, saya perlu memahami komponen yang ada yang akan dimodifikasi.

1. __Baca `src/components/public-library/ExerciseCard.tsx`__: Saya perlu melihat struktur komponen ini untuk mengetahui di mana dan bagaimana cara terbaik menambahkan tombol baru.
2. __Baca `src/components/public-library/PublicExerciseList.tsx`__: Saya perlu memahami bagaimana `ExerciseCard` dirender dan bagaimana *event handler* (seperti klik tombol) diteruskan dari komponen induk.
3. __Baca `src/pages/LibraryPage.tsx`__: Saya perlu memeriksa kembali bagaimana state untuk modal dan logika penugasan dikelola di halaman ini.

---

#### __Langkah 2: Modifikasi UI pada `ExerciseCard.tsx`__

Saya akan menambahkan tombol "Tugaskan ke Anak Saya" pada `ExerciseCard` khusus untuk pengguna dengan peran 'parent'.

__Rencana Aksi:__

1. __Modifikasi `src/components/public-library/ExerciseCard.tsx`__:

   - Tambahkan prop baru ke `ExerciseCardProps`, misalnya `userRole: string`.

   - Di dalam komponen, tambahkan logika kondisional:

     - Jika `userRole` adalah `'teacher'`, tampilkan tombol "+ Gunakan di Kelas Saya".
     - Jika `userRole` adalah `'parent'`, tampilkan tombol baru __"+ Tugaskan ke Anak Saya"__ dengan gaya yang mirip (warna biru primer).

   - Tombol baru ini akan memanggil fungsi `onAssignToChild` yang akan diteruskan melalui props.

---

#### __Langkah 3: Menghubungkan Aksi Tombol ke Modal__

Aksi klik pada tombol baru harus memicu modal `AssignToChildModal` yang sudah ada.

__Rencana Aksi:__

1. __Modifikasi `src/components/public-library/PublicExerciseList.tsx`__:

   - Pastikan `userRole` (dari `useAuth`) diteruskan sebagai prop ke setiap `ExerciseCard`.
   - Pastikan fungsi `onAssignToChild` diteruskan dengan benar ke setiap `ExerciseCard`. Fungsi ini akan bertanggung jawab untuk membuka modal.

2. __Modifikasi `src/pages/LibraryPage.tsx`__:
   - Fungsi `handleAssignToChild` sudah ada. Fungsi ini mengatur `selectedExercise` dan membuka `isAssignModalOpen`. Logika ini sudah tepat dan akan digunakan kembali.

3. __Modifikasi `src/components/classroom/AssignToChildModal.tsx`__:

   - Saya akan mengembalikan logika pemilihan anak ke *checkbox* (bukan *dropdown*) untuk memungkinkan penugasan ke banyak anak sekaligus, sesuai permintaan Anda ("ceklist anak yang mana").
   - Logika `handleAssign` di dalam modal akan diubah untuk menangani array `selectedChildren` lagi.

---

#### __Langkah 4: Finalisasi Alur Kerja__

Memastikan seluruh alur, dari klik tombol hingga penugasan berhasil, berjalan lancar.

__Rencana Aksi:__

1. __Pengujian Alur__: Setelah semua perubahan diimplementasikan, alurnya akan menjadi: 
   a. Orang tua melihat daftar latihan di `/library`. 
   b. Setiap `ExerciseCard` memiliki tombol "Tugaskan ke Anak Saya". 
   c. Mengklik tombol ini akan membuka `AssignToChildModal`. 
   d. Modal menampilkan daftar anak dengan *checkbox*. 
   e. Orang tua memilih satu atau lebih anak, lalu mengklik "Berikan Latihan". 
   f. Data disimpan ke tabel `parent_assignments`, dan modal menampilkan pesan sukses sebelum ditutup.

---

### **Fase 3: Peningkatan Kualitas Hidup (Quality of Life)**

Fitur-fitur ini memiliki prioritas lebih rendah dan akan diimplementasikan setelah fungsionalitas inti terbukti stabil dan berfungsi dengan baik.

**1. Penyempurnaan Alur Undangan via Email**
-   **Tugas:** Menangani kasus di mana orang tua mengundang seseorang yang belum memiliki akun EduWorksheets.
-   **Detail Teknis:** Memanfaatkan tabel `public.parent_invitations` untuk menyimpan token undangan. Saat pengguna baru mendaftar dengan email yang diundang, token tersebut akan digunakan untuk secara otomatis menautkan akun mereka ke orang tua yang mengundang.

**2. Fitur Komunikasi (Opsional)**
-   **Tugas:** Membangun sistem pesan sederhana di dalam platform.
-   **Detail Teknis:** Ini akan memerlukan desain skema baru untuk tabel pesan dan pengembangan UI chat. Ini adalah fitur kompleks yang akan dievaluasi lebih lanjut di masa depan.
