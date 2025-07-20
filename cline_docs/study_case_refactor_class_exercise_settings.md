# Studi Kasus: Refaktorisasi Tabel `class_exercises`

**Tanggal:** 18 Juli 2025
**Penulis:** Cline
**Status:** Selesai

## 1. Latar Belakang Masalah

Saat ini, tabel `class_exercises` menyimpan beberapa pengaturan penting terkait penugasan latihan (seperti batas waktu dan kebijakan penampilan jawaban) di dalam satu kolom JSONB bernama `settings`.

**Contoh Data Bermasalah:**
```json
{
  "time_limit": 90,
  "randomize_questions": true,
  "show_answers_policy": "After Deadline"
}
```

Pendekatan ini menyebabkan beberapa masalah signifikan:

1.  **Kesulitan Kueri:** Mengambil atau memfilter data berdasarkan nilai di dalam JSONB sangat tidak efisien dan memperlambat performa database.
2.  **Integritas Data Rendah:** Tidak ada penegakan tipe data atau batasan nilai di dalam JSONB. Kesalahan pengetikan pada kunci (misalnya, `tyme_limit` bukan `time_limit`) tidak akan terdeteksi oleh database dan menyebabkan bug yang sulit dilacak.
3.  **Kompleksitas Logika Backend:** Sistem lain (seperti sistem notifikasi atau pelaporan kemajuan) harus selalu mengurai JSONB ini, yang membuat logika bisnis menjadi rumit dan rawan kesalahan.
4.  **Hambatan untuk Otomatisasi:** Sulit untuk membuat *trigger* atau *job* database yang andal yang bergantung pada nilai-nilai yang "tersembunyi" di dalam JSONB.

Tujuan dari refaktorisasi ini adalah untuk mempromosikan pengaturan-pengaturan ini menjadi kolom kelas satu (first-class columns) di dalam tabel `class_exercises` untuk meningkatkan performa, integritas data, dan kemudahan pengembangan.

## 2. Analisis & Identifikasi Pengaturan

Berdasarkan analisis pada komponen `src/components/classroom/ClassExerciseSettingsModal.tsx`, pengaturan yang perlu direfaktor adalah:

*   **Dari dalam `settings` JSONB:**
    *   `time_limit`: `number | null` (dalam menit)
    *   `randomize_questions`: `boolean`
    *   `show_answers_policy`: `string`
*   **Kolom terkait yang sudah ada:**
    *   `due_date`: `timestamptz | null`
    *   `max_attempts`: `integer | null`
    *   `minimum_passing_grade`: `integer`

## 3. Rencana Aksi Implementasi

Refaktorisasi akan dilakukan melalui file migrasi Supabase baru. Rencana ini dirancang agar aman dan dapat diulang jika diperlukan, tanpa kehilangan data.

### Langkah 1: Membuat Tipe ENUM Baru

Untuk memastikan konsistensi pada kebijakan penampilan jawaban, sebuah tipe ENUM baru akan dibuat.

```sql
CREATE TYPE public.show_answers_policy_enum AS ENUM (
    'Immediately',
    'After Deadline',
    'On Max Attempts',
    'Manual'
);
```

### Langkah 2: Mengubah Tabel `class_exercises`

File migrasi akan menjalankan perintah `ALTER TABLE` untuk menambahkan kolom-kolom baru.

```sql
ALTER TABLE public.class_exercises
ADD COLUMN IF NOT EXISTS randomize_questions BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS show_answers_policy public.show_answers_policy_enum NOT NULL DEFAULT 'Immediately';
```
*Catatan: Kolom `time_limit` sudah ada sebagai `integer`, jadi kita tidak perlu menambahkannya lagi, cukup memigrasikan data ke dalamnya.*

### Langkah 3: Migrasi Data dari JSONB ke Kolom Baru

Ini adalah langkah paling krusial. Sebuah skrip `UPDATE` akan dijalankan untuk memindahkan data dari kolom `settings` yang lama ke kolom-kolom yang baru untuk semua baris yang ada.

```sql
UPDATE public.class_exercises
SET
    -- Pindahkan time_limit, pastikan tipenya benar (integer)
    time_limit = (settings->>'time_limit')::integer,
    
    -- Pindahkan randomize_questions, pastikan tipenya boolean
    randomize_questions = (settings->>'randomize_questions')::boolean,
    
    -- Pindahkan show_answers_policy, pastikan tipenya sesuai ENUM
    show_answers_policy = (settings->>'show_answers_policy')::public.show_answers_policy_enum
WHERE
    -- Hanya jalankan pada baris yang memiliki data di kolom settings
    settings IS NOT NULL AND settings::text != '{}'::text;
```
*Kondisi `WHERE` memastikan kita tidak mencoba memigrasikan data dari baris yang `settings`-nya kosong atau null.*

### Langkah 4: Menghapus Kolom `settings` yang Lama

Setelah data berhasil dimigrasikan, kolom `settings` yang sudah tidak terpakai akan dihapus untuk membersihkan skema.

```sql
ALTER TABLE public.class_exercises
DROP COLUMN IF EXISTS settings;
```

## 4. Dampak dan Langkah Selanjutnya

### Dampak pada Sistem

*   **Database:** Kueri pada tabel `class_exercises` akan lebih cepat. Integritas data akan meningkat.
*   **Notifikasi:** Memungkinkan pembuatan *trigger* dan *cron job* yang efisien untuk notifikasi terkait tugas baru dan batas waktu.
*   **Pelaporan:** Tabel `user_progress` dan `exercise_attempts` dapat dengan mudah mengakses `minimum_passing_grade` dan `max_attempts` untuk logika bisnis yang lebih bersih.

### Langkah Selanjutnya (Pasca-Migrasi)

1.  **Refaktor Frontend:**
    *   Perbarui komponen `ClassExerciseSettingsModal.tsx` untuk membaca dan menyimpan data ke kolom-kolom baru, bukan ke objek `settings`.
    *   Perbarui tipe `ClassExercise` di `src/types/index.ts`.
2.  **Refaktor Backend (jika ada):**
    *   Perbarui fungsi Supabase atau logika API apa pun yang sebelumnya bergantung pada pembacaan kolom `settings`.
3.  **Pembaruan Dokumentasi:**
    *   Perbarui dokumen `cline_docs/backendContext.md` untuk mencerminkan skema tabel `class_exercises` yang baru.

Dokumen ini berfungsi sebagai catatan resmi dari perubahan yang direncanakan.
