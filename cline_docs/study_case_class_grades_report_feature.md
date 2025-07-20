# Studi Kasus: Fitur Laporan Nilai Kelas untuk Guru

## 1. Latar Belakang

Guru memerlukan cara yang efisien untuk memantau kemajuan belajar seluruh siswa di dalam satu kelas. Saat ini, guru harus melihat laporan per siswa atau per latihan soal, yang memakan waktu dan tidak memberikan gambaran menyeluruh. Fitur ini bertujuan untuk menyajikan semua nilai siswa dari semua latihan soal dalam satu tampilan terpusat.

## 2. Deskripsi Fitur

Fitur ini akan menambahkan sebuah tab atau bagian baru di halaman detail kelas khusus untuk guru. Bagian ini akan menampilkan tabel (grid) yang berisi:
- **Baris**: Daftar nama siswa di kelas tersebut.
- **Kolom**: Daftar judul latihan soal yang telah ditugaskan di kelas.
- **Sel**: Nilai (skor) yang diperoleh masing-masing siswa pada setiap latihan soal. Jika siswa belum mengerjakan, sel akan kosong atau menampilkan status "Belum Mengerjakan".

Selain itu, akan ada tombol "Unduh sebagai Excel" yang memungkinkan guru untuk mengunduh data laporan nilai ini dalam format `.xlsx` untuk analisis lebih lanjut atau keperluan arsip.

## 3. Rencana Implementasi Teknis

Implementasi awal melibatkan pembuatan RPC `get_class_grades_report`, komponen frontend `ClassGradesGrid`, dan integrasi ke halaman detail kelas.

## 4. Isu yang Ditemukan dan Resolusi

**Status: SELESAI (COMPLETED)**

Selama implementasi dan pengujian, beberapa masalah kritis muncul dan telah berhasil diselesaikan:

1.  **Regresi RLS (Telah Diperbaiki)**: Pembuatan fungsi helper `is_teacher_of_class` secara tidak sengaja menimpa fungsi `is_class_member` yang ada, menyebabkan rusaknya kebijakan Row Level Security (RLS) di seluruh aplikasi. Akibatnya, daftar siswa menjadi kosong di mana-mana.
    -   **Solusi**: Fungsi helper diganti namanya menjadi `is_class_teacher`, dan fungsi `is_class_member` yang asli dipulihkan melalui migrasi baru yang aman (menghapus dan membuat kembali kebijakan yang bergantung).

2.  **Inkonsistensi Pengambilan Data Siswa (Telah Diperbaiki)**: Setelah perbaikan RLS, tab "Siswa" masih tidak dapat menampilkan nama siswa meskipun jumlahnya benar. Ini disebabkan karena RPC `get_class_details` tidak mengambil profil siswa secara lengkap.
    -   **Solusi**: RPC `get_class_details` diperbarui untuk menyertakan array profil siswa, dan frontend disesuaikan untuk menggunakan data ini. Ini memperbaiki tab "Siswa".

3.  **Laporan Nilai Kosong karena RLS (Telah Diperbaiki)**: Tab "Laporan Nilai" menampilkan pesan "Belum ada siswa di kelas ini" karena RLS pada tabel `class_students` memblokir query di dalam fungsi `get_class_grades_report`, meskipun fungsi tersebut berjalan dengan `SECURITY DEFINER`.
    -   **Solusi**: Fungsi `get_class_grades_report` dimodifikasi untuk menonaktifkan RLS sementara (`SET LOCAL astra.bypass_rls = 'on';`) selama eksekusinya. Ini memungkinkan fungsi untuk mengambil data siswa dengan benar dan aman, karena pemeriksaan otorisasi guru sudah dilakukan di awal fungsi.

Dengan semua perbaikan ini, fitur Laporan Nilai sekarang berfungsi seperti yang diharapkan, dan bug regresi yang ditimbulkannya telah teratasi.
