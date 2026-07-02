# Rencana Implementasi Fitur: Material Builder dengan Diagram AI

**Tanggal:** 6 Agustus 2025
**Penulis:** Cline

## 1. Ringkasan Fitur

**Tujuan:** Membuat fitur baru bernama "Material Builder" yang memungkinkan guru untuk menghasilkan materi pembelajaran interaktif menggunakan AI. Fitur ini akan meniru alur kerja dan UI dari "Exercise Builder" yang sudah ada untuk konsistensi.

**Fitur Utama:**
-   Guru memasukkan topik, jenjang, dan parameter lainnya.
-   AI menghasilkan draf materi pembelajaran yang terstruktur.
-   Materi dapat mencakup teks, pertanyaan interaktif (kuis singkat), dan diagram visual yang dihasilkan AI (menggunakan sintaks Mermaid.js).
-   Output disimpan dalam format JSONB untuk rendering dinamis.
-   Solusi ini dirancang agar tidak memerlukan biaya API eksternal (selain dari model bahasa yang sudah ada).

---

## 2. Arsitektur & Desain Teknis

### 2.1. Perubahan Backend (Supabase)

#### a. Tabel Baru
Akan ada 3 tabel baru untuk mendukung fitur ini, meniru arsitektur Latihan Soal (`exercises`, `exercise_attempts`, `user_progress`).

1.  **`materials`**: Katalog utama materi.
    *   **Acuan Desain:** Tabel `public.exercises`.
    *   **Skema SQL:**
        ```sql
        CREATE TABLE public.materials (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            created_at timestamp with time zone NOT NULL DEFAULT now(),
            user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            title text NOT NULL,
            description text,
            metadata jsonb,
            content jsonb,
            is_public boolean NOT NULL DEFAULT false,
            CONSTRAINT materials_pkey PRIMARY KEY (id)
        );
        ```

2.  **`material_attempts`**: Mencatat setiap pengerjaan materi interaktif oleh siswa.
    *   **Acuan Desain:** Tabel `public.exercise_attempts`.
    *   **Skema SQL:**
        ```sql
        CREATE TABLE public.material_attempts (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            created_at timestamp with time zone NOT NULL DEFAULT now(),
            user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
            answers jsonb NOT NULL,
            score double precision,
            manual_review_status text DEFAULT 'pending', -- 'pending' atau 'reviewed'
            feedback jsonb,
            CONSTRAINT material_attempts_pkey PRIMARY KEY (id)
        );
        ```

3.  **`material_progress`**: Mengagregasi kemajuan siswa pada sebuah materi.
    *   **Acuan Desain:** Tabel `public.user_progress`.
    *   **Skema SQL:**
        ```sql
        CREATE TABLE public.material_progress (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
            best_score double precision,
            status text, -- e.g., 'not_started', 'in_progress', 'completed'
            last_attempt_id uuid REFERENCES public.material_attempts(id),
            CONSTRAINT material_progress_pkey PRIMARY KEY (id),
            CONSTRAINT material_progress_user_material_unique UNIQUE (user_id, material_id)
        );
        ```

#### b. Kebijakan Row Level Security (RLS)
Kebijakan RLS akan diterapkan pada semua tabel baru, mengikuti logika yang sama dengan tabel acuannya (`exercises`, `exercise_attempts`, `user_progress`).
-   Pengguna hanya bisa mengakses data mereka sendiri.
-   Guru dapat melihat data siswa dalam konteks tertentu (jika materi ditugaskan).
-   Materi publik dapat diakses oleh semua.

#### c. Fungsi Database & Otomatisasi (Triggers & RPC)
Ini adalah bagian paling kritis untuk memastikan konsistensi dengan sistem yang ada.

1.  **Fungsi Trigger: `handle_material_attempt_update()`**
    *   **Tujuan:** Mengotomatiskan pembaruan tabel `material_progress` setiap kali siswa menyelesaikan pengerjaan di `material_attempts`.
    *   **Acuan Desain & Kode:** Fungsi `public.handle_exercise_attempt_update()`. Logikanya akan diadaptasi untuk menggunakan tabel `material_attempts` dan `material_progress`.
    *   **Pemicu (Trigger):** Sebuah trigger akan dibuat pada tabel `material_attempts` yang akan memanggil fungsi ini `AFTER INSERT`.
    *   **Dokumen Acuan Debugging:** `cline_docs/backendContext.md` (bagian 4), `cline_docs/study_case_student_progress_not_saving.md`.

2.  **Fungsi RPC (Remote Procedure Calls)**
    Untuk menghindari query yang kompleks dan rawan error RLS dari frontend, kita akan membuat fungsi RPC dengan `SECURITY DEFINER`.
    *   **`get_material_details(p_material_id uuid)`**
        *   **Tujuan:** Mengambil detail lengkap satu materi, termasuk konten JSON-nya.
        *   **Acuan Desain:** Fungsi `public.get_class_exercise_details_for_teacher(p_class_id, p_exercise_id)`. Fungsi ini akan lebih sederhana karena tidak memerlukan join yang rumit, tetapi pola pemanggilannya dari frontend akan sama.
        *   **Dokumen Acuan Debugging:** `cline_docs/backendContext.md` (bagian 5), `cline_docs/study_case_teacher_exercise_access_regression.md`.
    *   **`submit_material_attempt(p_material_id uuid, p_answers jsonb)`**
        *   **Tujuan:** Menyimpan hasil pengerjaan materi dari siswa secara aman.
        *   **Acuan Desain:** Fungsi `public.submit_exercise_attempt()`. Ini penting untuk memvalidasi data di sisi server sebelum `INSERT` ke `material_attempts`.
        *   **Dokumen Acuan Debugging:** `cline_docs/backendContext.md` (bagian 4), `cline_docs/study_case_student_submission_fix.md`.
    *   **`get_material_attempts_for_review(p_material_id uuid)`**
        *   **Tujuan:** Mengambil daftar pengerjaan siswa untuk sebuah materi, khusus untuk antarmuka penilaian guru.
        *   **Acuan Desain:** Fungsi `public.get_class_grades_report(p_class_id)`. Meskipun tujuannya sedikit berbeda, pola pengambilan data agregat untuk guru akan serupa.
        *   **Dokumen Acuan Debugging:** `cline_docs/backendContext.md` (bagian 5), `cline_docs/study_case_class_grades_report_feature.md`.

### 2.2. Struktur JSON `content`

Kolom `content` akan menjadi sebuah array dari objek-objek "blok". Ini memungkinkan rendering yang fleksibel dan dinamis.

**Contoh Struktur:**
```json
[
  {
    "id": "block-1",
    "type": "paragraph",
    "data": {
      "text": "Ini adalah paragraf penjelasan tentang suatu konsep."
    }
  },
  {
    "id": "block-2",
    "type": "multiple_choice_quiz",
    "data": {
      "question": "Apa ibu kota Indonesia?",
      "options": ["Bandung", "Jakarta", "Surabaya"],
      "correct_answer": "Jakarta",
      "explanation": "Jakarta adalah pusat pemerintahan dan ekonomi Indonesia."
    }
  },
  {
    "id": "block-3",
    "type": "mermaid_diagram",
    "data": {
      "syntax": "graph TD\nA --> B\nB --> C",
      "caption": "Diagram alur sederhana."
    }
  }
]
```

### 2.3. Perubahan Frontend (React)

#### a. Struktur Direktori Baru
```
src/
├── pages/
│   └── MaterialBuilderPage.tsx
├── components/
│   └── material-builder/
│       ├── MaterialBuilder.tsx
│       ├── MaterialPromptBuilderForm.tsx
│       └── MaterialRenderer.tsx
└── services/
    └── materialService.ts
```

#### b. Komponen Utama
-   **`MaterialBuilderPage.tsx`**: Halaman utama yang menampung seluruh antarmuka builder.
-   **`MaterialBuilder.tsx`**: Komponen stateful yang mengelola data form, proses pemanggilan AI, dan state dari `content` materi yang sedang dibuat.
-   **`MaterialPromptBuilderForm.tsx`**: Form untuk guru memasukkan parameter (topik, gaya bahasa, dll.). Komponen ini akan secara dinamis membuat prompt teks yang sangat detail untuk dikirim ke AI.
-   **`MaterialRenderer.tsx`**: Komponen yang akan me-looping array `content` dan me-render blok yang sesuai (paragraf, kuis, atau diagram Mermaid).

#### c. Integrasi Mermaid.js
1.  **Instalasi:** `npm install mermaid`
2.  **Implementasi:** Di dalam `MaterialRenderer.tsx`, akan ada komponen khusus untuk blok `mermaid_diagram`.
    ```tsx
    // Contoh di dalam MaterialRenderer
    import mermaid from 'mermaid';
    import React, { useEffect } from 'react';

    useEffect(() => {
      mermaid.initialize({ startOnLoad: true });
      mermaid.contentLoaded();
    }, []);

    // ... saat me-render blok diagram
    <div className="mermaid">
      {block.data.syntax}
    </div>
    ```

### 2.4. Alur Kerja AI
1.  Guru mengisi `MaterialPromptBuilderForm`.
2.  Aplikasi membuat sebuah prompt teks yang komprehensif, termasuk instruksi untuk menghasilkan output JSON dengan skema yang telah ditentukan dan menyertakan sintaks Mermaid jika perlu.
3.  Prompt dikirim ke model AI (misalnya, melalui Supabase Edge Function).
4.  AI mengembalikan respons dalam format string JSON.
5.  Aplikasi mem-parsing string JSON tersebut dan menampilkannya di `MaterialRenderer`.
6.  Guru dapat mereview, mengedit, dan menyimpan materi.

---

## 3. Potensi Risiko dan Mitigasi

1.  **Risiko:** AI menghasilkan JSON yang tidak valid atau sintaks Mermaid yang salah.
    *   **Mitigasi:**
        *   **Prompt Engineering:** Membuat instruksi di dalam prompt se-spesifik mungkin mengenai skema JSON yang diharapkan.
        *   **Validasi Frontend:** Sebelum mencoba me-render, lakukan validasi dasar pada JSON yang diterima. Gunakan blok `try-catch` saat `JSON.parse()`.
        *   **UI Error yang Jelas:** Jika parsing gagal, tampilkan pesan error yang jelas kepada pengguna ("Gagal memproses respons dari AI, silakan coba lagi") daripada membuat aplikasi crash.

2.  **Risiko:** Render diagram Mermaid gagal atau terlihat aneh.
    *   **Mitigasi:**
        *   **Inisialisasi yang Benar:** Pastikan `mermaid.initialize()` dan `mermaid.contentLoaded()` dipanggil dengan benar di dalam `useEffect`.
        *   **Error Boundary:** Bungkus komponen render diagram dengan React Error Boundary untuk menangkap error render dan menampilkan fallback UI.

3.  **Risiko:** Performa lambat saat me-render materi yang sangat panjang dengan banyak diagram.
    *   **Mitigasi:**
        *   **Virtualisasi:** Untuk materi yang sangat panjang, pertimbangkan untuk menggunakan library seperti `react-window` atau `react-virtualized` untuk hanya me-render blok yang terlihat di layar. (Ini bisa menjadi optimasi di masa depan).

---

Dokumen ini akan berfungsi sebagai panduan utama selama pengembangan. Setiap penyimpangan dari rencana ini harus didiskusikan dan dicatat.
