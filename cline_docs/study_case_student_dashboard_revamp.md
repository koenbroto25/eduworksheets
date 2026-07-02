# Studi Kasus: Perombakan Total Student Dashboard

Dokumen ini mencatat proses perancangan, pengembangan, dan integrasi Student Dashboard baru untuk meningkatkan pengalaman pengguna siswa.

## 1. Latar Belakang & Masalah

- **Masalah:** Dashboard yang ada (`DashboardPage.tsx`) bersifat generik untuk semua peran (guru, siswa, orang tua). Siswa tidak memiliki pusat kendali yang jelas dan termotivasi. Tugas dari berbagai sumber (guru, orang tua, mandiri) tidak terorganisir dengan baik.
- **Tujuan:** Menciptakan UI dashboard yang modern, informatif, dan komprehensif khusus untuk siswa, sambil memastikan semua fungsionalitas backend yang ada tetap terintegrasi dengan benar untuk menghindari regresi.

## 2. Perancangan UI (Fase Perencanaan)

- **Konsep Utama:** Mengadopsi layout berbasis widget modular yang disebut "Command Center".
- **File Desain:** Rencana desain didokumentasikan dalam `cline_docs/ui_design_notes.md` di bawah bagian "Feature: Student Dashboard".
- **Komponen Utama yang Direncanakan:**
    1.  **Header:** Menampilkan nama, avatar, notifikasi, dan elemen gamifikasi (poin).
    2.  **Today's Focus Widget:** Menampilkan tugas dengan tenggat hari ini, dibedakan berdasarkan sumber (guru, ortu, mandiri).
    3.  **All Assignments Widget:** Daftar lengkap semua tugas dengan fungsionalitas filter dan penanda status visual.
    4.  **My Progress Widget:** Visualisasi progres akademik per mata pelajaran.
    5.  **My Classes & Practice Library Widgets:** Tautan cepat ke halaman kelas dan perpustakaan latihan mandiri.

## 3. Implementasi Frontend (Fase Aksi)

### 3.1. Pembuatan Struktur File

Struktur file berikut dibuat untuk mengisolasi fitur baru:

-   **Halaman Utama:**
    -   `src/pages/StudentDashboardPage.tsx`: Sebagai container utama untuk layout dashboard.
-   **Direktori Komponen:**
    -   `src/components/student-dashboard/`: Direktori baru untuk semua widget.
-   **Komponen Widget (dengan data placeholder):**
    -   `AssignmentsWidget.tsx`
    -   `TodayFocusWidget.tsx`
    -   `ProgressWidget.tsx`

### 3.2. Routing

-   **File yang Dimodifikasi:** `src/router/index.tsx`
-   **Perubahan:**
    1.  Mengimpor `StudentDashboardPage`.
    2.  Menambahkan rute baru yang dilindungi khusus untuk siswa:
        ```typescript
        <Route path="/student-dashboard" element={
          <ProtectedRoute allowedRoles={['student']}>
            <MainLayout>
              <StudentDashboardPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        ```

## 4. Integrasi Backend & Fetching Data

### 4.1. Analisis Kode Lama

-   **File yang Dianalisis:** `src/pages/DashboardPage.tsx`
-   **Temuan Kunci:** Ditemukan bahwa logika pengambilan data siswa sudah ada dan terpusat dalam satu panggilan fungsi:
    ```typescript
    result = await supabaseService.getStudentDashboardData(supabase, user.id);
    ```
-   **Kesimpulan:** Ini adalah pendekatan "single source of truth" yang sangat baik. Kita tidak perlu membuat fungsi backend baru, cukup menggunakan kembali yang sudah ada.

### 4.2. Rencana Integrasi

1.  **Pindahkan Logika:** Logika `fetchData` dari `DashboardPage.tsx` akan disalin ke `StudentDashboardPage.tsx`.
2.  **Salurkan Props:** State `dashboardData` yang berisi hasil fetch akan dipecah dan disalurkan sebagai props ke masing-masing komponen widget.
    -   `AssignmentsWidget` akan menerima `dashboardData.allAssignments`.
    -   `ProgressWidget` akan menerima `dashboardData.recentGrades`.
    -   `TodayFocusWidget` juga akan memfilter dari `dashboardData.allAssignments` untuk tugas yang relevan.
3.  **Adaptasi Widget:** Komponen widget akan dimodifikasi untuk menerima props dan merender data dinamis, menggantikan data placeholder.

### 4.3. Status Implementasi Integrasi
-   **[SELESAI]** Logika `fetchData` dari `DashboardPage.tsx` telah berhasil dipindahkan ke `StudentDashboardPage.tsx`.
-   **[SELESAI]** `StudentDashboardPage.tsx` kini mengelola state `dashboardData` dan menyalurkannya sebagai props ke komponen-komponen widget.
-   **[SELESAI]** Semua komponen widget (`AssignmentsWidget`, `TodayFocusWidget`, `ProgressWidget`) telah di-refactor untuk menerima props dan menampilkan data dinamis. Error TypeScript terkait props telah diperbaiki.

## 5. Pengalihan Pasca-Login (Redirect)

-   **Tantangan:** Saat ini, semua pengguna dialihkan ke `/dashboard` generik setelah login.
-   **Solusi yang Diimplementasikan:**
    1.  **Modifikasi `AuthContext.tsx`:** Fungsi `login` diubah agar mengembalikan data pengguna (`{ user: User | null }`) setelah berhasil diautentikasi. Ini memungkinkan komponen pemanggil untuk langsung mengakses peran pengguna.
    2.  **Modifikasi `Login.tsx`:** Logika `handleSubmit` diubah untuk menerima data pengguna dari fungsi `login`. Sebuah kondisi `if (user?.role === 'student')` ditambahkan untuk mengarahkan siswa ke `/student-dashboard`, sementara pengguna lain diarahkan ke rute default.
-   **Status:** **[SELESAI]** Pengalihan berbasis peran telah berhasil diimplementasikan.

---
*Dokumen ini akan diperbarui seiring dengan kemajuan implementasi.*
