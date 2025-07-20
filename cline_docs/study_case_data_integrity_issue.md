# Studi Kasus: Masalah Integritas Data pada Exercise Builder

**Status:** Unfinished

## Latar Belakang

Pengguna melaporkan bahwa beberapa kolom data di tabel `exercises` tidak disimpan dengan benar saat membuat latihan baru melalui *exercise builder*. Kolom-kolom yang bermasalah adalah:
- `material`
- `minimum_passing_grade`
- `curriculum_type`
- `semester`
- `question_types`

Selain itu, beberapa error muncul selama proses perbaikan, yang mengindikasikan masalah yang lebih dalam pada alur data.

## Progres Perbaikan

### Investigasi Awal

1.  **Analisis Tipe Data**: Memeriksa `src/types/index.ts` untuk memastikan semua kolom yang dilaporkan telah didefinisikan dengan benar di tipe `Exercise`. **Hasil:** Tipe data sudah benar.
2.  **Pemeriksaan Komponen UI**: Menganalisis `ExerciseBuilder.tsx`, `SaveExerciseModal.tsx`, dan `ExerciseSettings.tsx` untuk melacak alur data. **Hasil:** `SaveExerciseModal` menggunakan state lokal yang tidak lengkap, yang menyebabkan data hilang.
3.  **Pemeriksaan Service Layer**: Memeriksa `supabaseService.ts` dan menemukan bahwa fungsi `createExercise` tidak memetakan nama kolom dari camelCase ke snake_case dengan benar.

### Perbaikan Tahap 1

1.  **Memperbaiki `SaveExerciseModal.tsx`**: Mengubah fungsi `handleSave` untuk menggabungkan state lokal dengan data utama dari `exerciseData`, memastikan tidak ada data yang hilang.
2.  **Memperbaiki `supabaseService.ts`**: Memperbarui fungsi `createExercise` untuk secara eksplisit memetakan semua nama kolom yang relevan ke format snake_case.

### Masalah Baru dan Perbaikan Lanjutan

1.  **Error `createdAt`**: Setelah perbaikan pertama, muncul error `Could not find the 'createdAt' column`. **Penyebab:** Aplikasi mengirimkan `createdAt` yang seharusnya dibuat oleh database. **Solusi:** Memperbaiki `ExerciseBuilderPage.tsx` untuk mengirimkan objek data yang bersih tanpa `createdAt`.
2.  **Error `is_public`**: Muncul error `null value in column "is_public"`. **Penyebab:** Kesalahan penamaan variabel (`isPublic` vs `is_public`). **Solusi:** Memperbaiki nama variabel di `ExerciseBuilderPage.tsx` dan memberikan nilai default.
3.  **Error `check_assessment_type_values`**: Muncul error `violates check constraint "check_assessment_type_values"`. **Penyebab:** Nilai default untuk `assessment_type` tidak valid. **Solusi:** Memeriksa file migrasi, menemukan nilai yang valid, dan memperbarui nilai default di `ExerciseBuilderPage.tsx`.
4.  **Inkonsistensi Tampilan**: Pengguna melaporkan bahwa data di "AI Prompt Setting" tidak sinkron dengan "Basic Setting". **Penyebab:** `ExerciseBuilder.tsx` tidak meneruskan `assessment_type` yang diperbarui ke `PromptBuilderForm`. **Solusi:** Memperbaiki `ExerciseBuilder.tsx` untuk memastikan data yang dikirim selalu yang terbaru.
5.  **Refaktor Alur Data Pengaturan**: Untuk mengatasi masalah integritas data yang berkelanjutan, alur kerja di *exercise builder* diubah. Sekarang, semua pengaturan dari tab "Basic Setting" diambil sebagai *snapshot* statis ketika pengguna menekan tombol "Terapkan". *Snapshot* ini kemudian ditampilkan sebagai ringkasan yang tidak dapat diubah di tab "AI Prompt Setting", memastikan bahwa data yang digunakan untuk pembuatan prompt konsisten dan tidak berubah.

### Refaktor Arsitektur untuk Pengambilan Opsi Filter

Sebagai bagian dari upaya perbaikan yang lebih luas, arsitektur untuk mengelola opsi filter (seperti `grade`, `subject`, `difficulty_level`, dll.) telah dirombak total.

1.  **Sumber Kebenaran Tunggal (Single Source of Truth)**: Dibuat Supabase Edge Function baru (`get-all-options`) untuk menyediakan semua opsi filter dari satu sumber. Ini menghilangkan kebutuhan untuk mengelola daftar opsi di sisi frontend, yang rentan terhadap inkonsistensi.
2.  **Refaktor Komponen Frontend**: Komponen yang relevan, termasuk `ExerciseSettings`, `EditExerciseInfoModal`, dan `MyExercises`, telah direfaktor untuk mengambil data filter langsung dari Edge Function ini. Perubahan ini memastikan bahwa opsi yang ditampilkan kepada pengguna selalu sinkron dengan apa yang tersedia di backend.

Meskipun refaktor ini awalnya ditujukan untuk memperbaiki masalah filter di seluruh aplikasi, ini juga secara tidak langsung memperkuat integritas data di *exercise builder* dengan memastikan bahwa nilai-nilai yang dipilih untuk kolom-kolom seperti `grade` dan `subject` berasal dari sumber yang valid dan terpusat.

## Status Saat Ini

Meskipun alur data telah diperbaiki dengan mekanisme *snapshot*, masalah integritas data saat penyimpanan akhir (`onSave`) masih perlu divalidasi sepenuhnya. Kasus ini belum selesai dan memerlukan pengujian lebih lanjut untuk memastikan semua data dari *snapshot* disimpan dengan benar ke database.
