# Studi Kasus: Guru Tidak Dapat Membuat Kelas Meskipun Login Sebagai Guru

## Latar Belakang Masalah

Seorang pengguna yang terdaftar dengan peran (role) 'teacher' melaporkan bahwa mereka tidak dapat membuat kelas baru. Setiap kali mereka mencoba, sistem menampilkan pesan error: "Only teachers can create classes. Please make sure you are logged in with a teacher account."

Investigasi awal di frontend menunjukkan bahwa konteks otentikasi (`AuthContext`) sudah benar mengenali pengguna sebagai 'teacher', dan permintaan pembuatan kelas dikirim dengan benar ke backend. Hal ini mengindikasikan bahwa masalahnya terletak di lapisan backend, khususnya pada kebijakan Row Level Security (RLS) di database Supabase.

## Analisis Teknis

Pemeriksaan pada kebijakan RLS untuk tabel `classes` mengungkapkan kebijakan `INSERT` sebagai berikut:

```sql
CREATE POLICY "Teachers can create classes"
ON public.classes FOR INSERT
WITH CHECK (
  (teacher_id = auth.uid()) AND
  (EXISTS (
    SELECT 1
    FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'teacher'::user_role
  ))
);
```

Kebijakan ini memiliki kelemahan kritis: ia menggunakan subquery (`EXISTS`) untuk memeriksa peran pengguna di tabel `public.users`. Meskipun data peran pengguna di tabel `public.users` sudah benar, ada kemungkinan terjadi kondisi balapan (race condition) atau masalah visibilitas transaksi di PostgreSQL.

**Hipotesis:**
Ketika pengguna baru mendaftar, ada dua operasi yang terjadi hampir bersamaan:
1.  Trigger `handle_new_user` menyisipkan data ke `public.users`.
2.  Pengguna mencoba membuat kelas, yang memicu `INSERT` ke `classes`.

Transaksi `INSERT` kelas mungkin dimulai sebelum transaksi `INSERT` ke `public.users` sepenuhnya terlihat (committed and visible). Akibatnya, subquery di dalam kebijakan RLS tidak menemukan baris yang cocok di `public.users` dan gagal, meskipun data sebenarnya sudah benar.

## Solusi

Solusi yang diimplementasikan adalah dengan menyederhanakan dan memperkuat kebijakan RLS dengan menghilangkan ketergantungan pada subquery ke tabel `public.users`. Sebaliknya, kebijakan baru ini akan bergantung pada fungsi helper SQL yang membaca peran pengguna langsung dari sumber kebenaran otentikasi: JSON Web Token (JWT).

**Langkah-langkah Implementasi:**

1.  **Membuat Fungsi Helper `get_user_role()`:**
    Sebuah fungsi SQL `get_user_role()` dibuat untuk mengekstrak klaim `role` langsung dari JWT sesi pengguna saat ini. Fungsi ini didefinisikan sebagai `SECURITY DEFINER` untuk memastikan ia berjalan dengan hak akses yang benar.

    ```sql
    CREATE OR REPLACE FUNCTION get_user_role()
    RETURNS text AS $$
    BEGIN
      RETURN auth.jwt()->>'role';
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ```

2.  **Memperbarui Kebijakan RLS `INSERT` pada Tabel `classes`:**
    Kebijakan `INSERT` yang lama dan rentan dihapus dan diganti dengan kebijakan baru yang lebih sederhana dan andal.

    ```sql
    -- Hapus kebijakan lama
    DROP POLICY "Teachers can create classes" ON public.classes;

    -- Buat kebijakan baru yang lebih andal
    CREATE POLICY "Teachers can create classes"
    ON public.classes FOR INSERT
    TO authenticated
    WITH CHECK (
      (get_user_role() = 'teacher') AND (teacher_id = auth.uid())
    );
    ```

## Hasil

Dengan kebijakan RLS yang baru, validasi peran tidak lagi bergantung pada timing transaksi tabel `users`. Sebaliknya, ia langsung memverifikasi peran dari JWT yang sudah terotentikasi, yang menghilangkan kondisi balapan dan menyelesaikan masalah secara definitif. Pengguna dengan peran 'teacher' sekarang dapat membuat kelas tanpa error.
