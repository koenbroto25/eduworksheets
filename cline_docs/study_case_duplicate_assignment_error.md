# Studi Kasus Final: Investigasi Error Penugasan Latihan Berlapis

**Tanggal:** 23 Juli 2025
**Penulis:** Cline
**Status:** Selesai & Terdokumentasi

## 1. Ringkasan Masalah

Dokumen ini adalah analisis post-mortem lengkap dari serangkaian error yang terjadi saat seorang guru menugaskan latihan ke kelas. Masalah ini bermanifestasi dalam beberapa bentuk error yang berbeda, yang pada akhirnya mengarah pada penemuan beberapa masalah mendasar di lapisan database dan frontend.

Error yang dilaporkan secara berurutan:
1.  `duplicate key value violates unique constraint "class_exercises_class_id_exercise_id_key"`
2.  `Gagal menugaskan latihan: record "new" has no field "student_id"`

## 2. Kronologi Investigasi & Resolusi

Investigasi ini melalui beberapa fase, di mana setiap fase mengungkap lapisan masalah yang lebih dalam.

### Fase 1: Masalah di Frontend & Solusi RPC Awal

-   **Analisis Awal:** Error `duplicate key` awalnya diidentifikasi sebagai masalah di sisi frontend. Logika untuk memeriksa apakah sebuah latihan sudah ditugaskan terlalu rumit untuk dievaluasi oleh kebijakan Row Level Security (RLS) dari sisi klien, menyebabkan aplikasi salah mengira bisa melakukan `INSERT` padahal data sudah ada.
-   **Tindakan:** Logika dipindahkan ke backend melalui fungsi RPC.
-   **File Terkait:** `supabase/migrations/20250722103600_create_assign_exercise_to_classes_rpc.sql` membuat fungsi `assign_exercise_to_classes` yang menggunakan `ON CONFLICT DO NOTHING` untuk menangani duplikasi secara aman.

### Fase 2: Munculnya Error Trigger & Perbaikan Frontend

-   **Masalah Baru:** Setelah RPC diimplementasikan, error berubah menjadi `record "new" has no field "student_id"`. Ini menandakan masalah ada di **database trigger**.
-   **Analisis Frontend:** Investigasi lebih lanjut menemukan bahwa frontend tidak pernah memanggil fungsi RPC yang baru dibuat.
    -   `src/services/supabaseService.ts` tidak memiliki fungsi untuk memanggil RPC `assign_exercise_to_classes`.
    -   Komponen UI `src/components/dashboard/MyExercises.tsx` melakukan panggilan `supabase.from('class_exercises').insert(...)` secara langsung, yang tidak aman dan memicu error.
-   **Tindakan Perbaikan Frontend:**
    1.  Fungsi `assignExerciseToClasses` ditambahkan ke `src/services/supabaseService.ts`.
    2.  Komponen `src/components/dashboard/MyExercises.tsx` diperbarui untuk menggunakan `supabaseService.assignExerciseToClasses`, memastikan panggilan yang benar ke RPC.

### Fase 3: Penemuan Trigger Bermasalah yang Sebenarnya

-   **Masalah Tetap Ada:** Meskipun frontend sudah diperbaiki, error `record "new" has no field "student_id"` tetap muncul, membuktikan bahwa masalah di trigger database sangat nyata.
-   **Analisis Trigger:** Verifikasi manual pada trigger yang aktif di tabel `class_exercises` mengungkap keberadaan dua trigger terkait notifikasi:
    1.  `trigger_notify_on_new_assignment` (Benar)
    2.  `on_new_class_assignment_notify_parent` (Salah)
-   **Akar Masalah Ditemukan:** Trigger `on_new_class_assignment_notify_parent` memanggil fungsi `handle_new_assignment_parent_notification`. Fungsi ini, seperti yang terlihat di `supabase/migrations/20250720231000_definitive_notification_fix.sql`, dirancang untuk tabel yang memiliki kolom `student_id`. Karena `class_exercises` tidak memiliki kolom tersebut, trigger ini **pasti gagal** setiap kali ada `INSERT` baru, menyebabkan seluruh transaksi dibatalkan.

### Fase 4: Solusi Definitif - Konsolidasi Trigger

-   **Analisis Final:** Keberadaan dua trigger yang saling bertentangan adalah inti masalahnya. Satu trigger benar, satu lagi salah dan menyebabkan error. Solusi terbaik adalah menghilangkan yang salah dan menggabungkan fungsionalitasnya ke dalam yang benar.
-   **Tindakan Perbaikan Definitif:** Sebuah migrasi tunggal dibuat untuk membersihkan dan mengkonsolidasikan logika.
-   **File Terkait:** `supabase/migrations/20250723220000_consolidate_assignment_notifications.sql`
    1.  **Menghapus Artefak Lama:** Secara eksplisit `DROP TRIGGER on_new_class_assignment_notify_parent` dan `DROP FUNCTION handle_new_assignment_parent_notification`.
    2.  **Menyempurnakan Fungsi Utama:** Memperbarui fungsi `handle_new_assignment_notification` untuk tidak hanya mengirim notifikasi ke siswa, tetapi juga melakukan loop tambahan untuk mencari dan mengirim notifikasi ke orang tua dari setiap siswa.

## 3. Kesimpulan & Pelajaran yang Diambil

Masalah ini adalah contoh klasik dari "bug berlapis" di mana beberapa masalah di berbagai bagian sistem (frontend, backend, dan database) saling menutupi dan menghasilkan perilaku yang membingungkan.

-   **Pentingnya RPC:** Logika bisnis yang kompleks atau memerlukan penanganan transaksi yang aman (seperti `ON CONFLICT`) harus selalu dieksekusi di backend melalui fungsi RPC, bukan dari frontend.
-   **Manajemen Trigger:** Trigger adalah alat yang sangat kuat tetapi juga berbahaya jika tidak dikelola dengan hati-hati. Trigger yang usang atau tidak lagi sesuai dengan skema tabel saat ini harus dibersihkan secara proaktif.
-   **Dokumentasi Kontekstual:** Tanpa meninjau studi kasus `study_case_refactor_class_exercise_settings.md`, kita mungkin tidak akan secepat itu memahami mengapa trigger notifikasi orang tua menjadi tidak valid. Perubahan skema besar harus selalu didokumentasikan.
-   **Debugging End-to-End:** Solusi tidak hanya terletak di satu tempat. Perbaikan memerlukan analisis dan tindakan di seluruh tumpukan teknologi, mulai dari komponen UI, lapisan layanan, hingga skema dan otomatisasi database.
