# Studi Kasus: Perbaikan Kebijakan Keamanan (RLS) untuk Penugasan Latihan Kelas

## 1. Laporan Masalah (Error Report)

Pengguna dengan peran "teacher" melaporkan bahwa mereka tidak dapat menugaskan latihan ke kelas mereka. Saat tombol "Tugaskan" diklik di komponen `ExerciseCard`, aplikasi menampilkan pesan error: `Gagal menugaskan latihan: new row violates row-level security policy for table "class_exercises"`.

Investigasi awal oleh pengguna mengonfirmasi bahwa jika Row-Level Security (RLS) pada tabel `class_exercises` dinonaktifkan sementara, fitur penugasan berjalan dengan sukses. Ini membuktikan secara konklusif bahwa akar masalah terletak pada konfigurasi RLS.

## 2. Analisis Awal

Berdasarkan laporan dan kebijakan RLS yang diberikan, masalah utama teridentifikasi pada kebijakan `INSERT` untuk tabel `class_exercises`:

- **Nama Kebijakan**: `Teachers can assign exercises to own classes`
- **Operasi**: `INSERT`
- **Kondisi**: `null`

Kondisi `null` pada kebijakan `INSERT` secara efektif memblokir semua upaya untuk menambahkan baris baru karena tidak ada aturan eksplisit yang mengizinkannya. Supabase, secara default, menolak operasi jika tidak ada kebijakan yang secara eksplisit memberikan izin. Logika frontend di `ExerciseCard.tsx` yang memanggil `supabase.from('class_exercises').insert(...)` sudah benar, sehingga fokus perbaikan adalah murni pada backend.

## 3. Proses Iterasi dan Debugging (Error Persistence)

Proses perbaikan memerlukan beberapa iterasi karena kompleksitas yang tidak terduga dalam penerapan RLS oleh Supabase.

### Upaya Pertama: `DROP` dan `CREATE POLICY`

- **Rencana**: Membuat migrasi SQL untuk menghapus (`DROP`) kebijakan yang salah dan membuat ulang (`CREATE`) dengan kondisi `WITH CHECK` yang benar.
- **File Migrasi**: `20250720013000_fix_class_exercise_insert_rls.sql`
- **Hasil**: Gagal. Meskipun migrasi dijalankan, kebijakan di database tidak berubah, dan error tetap ada. Ini menunjukkan bahwa `DROP` dan `CREATE` dalam satu transaksi mungkin tidak diterapkan seperti yang diharapkan oleh sistem migrasi.

### Upaya Kedua: `ALTER POLICY`

- **Rencana**: Menggunakan pendekatan yang lebih langsung dengan `ALTER POLICY` untuk memodifikasi kebijakan yang sudah ada. Ini dianggap lebih aman dan lebih kecil kemungkinannya untuk gagal.
- **File Migrasi**: `20250720013500_alter_class_exercise_insert_rls.sql`
- **Hasil**: Gagal. Sama seperti upaya pertama, error tetap berlanjut. Ini menandakan kemungkinan adanya masalah yang lebih dalam terkait bagaimana Supabase mengevaluasi kondisi `EXISTS` dalam konteks `INSERT` atau masalah dengan cache skema.

## 4. Solusi Akhir: Fungsi Helper SQL (Best Practice)

Mengingat kegagalan pendekatan langsung, solusi akhir beralih ke praktik terbaik untuk RLS yang kompleks: menggunakan fungsi helper SQL.

- **Rencana**:
    1.  Membuat fungsi SQL `is_teacher_of_class(p_class_id uuid)` yang mengisolasi logika verifikasi. Fungsi ini memeriksa apakah `auth.uid()` cocok dengan `teacher_id` di tabel `classes`. Penggunaan `SECURITY DEFINER` memastikan fungsi berjalan dengan hak akses yang memadai untuk memeriksa tabel `classes`.
    2.  Menghapus kebijakan lama yang bermasalah untuk memastikan tidak ada konflik.
    3.  Membuat kebijakan `INSERT` baru yang bersih dan sederhana, yang memanggil fungsi helper ini dalam klausa `WITH CHECK`.

- **File Migrasi Final**: `20250720014000_fix_class_exercise_rls_with_helper_function.sql`

- **Kode SQL Final**:
  ```sql
  -- Step 1: Create a helper function
  CREATE OR REPLACE FUNCTION public.is_teacher_of_class(p_class_id uuid)
  RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.classes WHERE id = p_class_id AND teacher_id = auth.uid()
    );
  $$;

  -- Step 2: Drop the old policy
  DROP POLICY IF EXISTS "Teachers can assign exercises to own classes" ON public.class_exercises;

  -- Step 3: Create the new policy using the helper function
  CREATE POLICY "Teachers can assign exercises to own classes"
  ON public.class_exercises FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher_of_class(class_id));
  ```

- **Hasil**: **Sukses**. Pendekatan ini berhasil menyelesaikan masalah secara permanen. Fungsi helper memberikan lapisan abstraksi yang membuat kebijakan lebih mudah dibaca, dikelola, dan yang terpenting, dievaluasi dengan benar oleh Supabase.

## 5. Kesimpulan

Masalah ini menyoroti pentingnya pengujian RLS yang cermat dan potensi kompleksitas dalam evaluasi kebijakan di Supabase. Ketika kebijakan langsung gagal, penggunaan fungsi helper `SECURITY DEFINER` adalah solusi yang kuat dan andal yang sejalan dengan praktik terbaik rekayasa perangkat lunak: abstraksi dan pemisahan masalah (separation of concerns).
