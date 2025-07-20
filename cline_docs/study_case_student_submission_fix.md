# Studi Kasus: Perbaikan Error Kritis Penyimpanan Hasil Latihan Siswa

## Status: `resolved`

## Gejala Awal
Siswa melaporkan bahwa setelah menyelesaikan latihan, hasil pengerjaan mereka tidak disimpan di backend. Analisis konsol browser secara konsisten menunjukkan error HTTP 400 saat memanggil RPC `submit_exercise_attempt`.

## Ringkasan Masalah
Investigasi mendalam mengungkapkan serangkaian masalah yang saling tumpang tindih dan berlapis, berakar pada ketidakselarasan antara skema database yang aktif dan logika bisnis yang diimplementasikan dalam berbagai fungsi trigger PostgreSQL. Masalah-masalah ini tidak terdokumentasi dengan baik dalam file migrasi, menunjukkan adanya perubahan manual atau migrasi yang tidak lengkap di masa lalu.

Akar masalah utama adalah sebagai berikut:
1.  **Skema `user_progress` yang Usang**: Beberapa trigger masih merujuk pada kolom-kolom lama di tabel `user_progress` yang telah dihapus dalam refactoring sebelumnya.
2.  **Fungsi Notifikasi yang Tidak Sinkron**: Terdapat beberapa fungsi trigger notifikasi yang berbeda, termasuk satu fungsi terpusat yang tidak terdokumentasi (`handle_notification_creation`), yang semuanya masih mencoba memasukkan data ke dalam kolom `link` yang sudah tidak ada di tabel `notifications`.
3.  **ENUM `notification_type` yang Tidak Lengkap**: Setelah memperbaiki referensi ke kolom `link`, ditemukan bahwa `ENUM` untuk tipe notifikasi tidak memiliki nilai `assignment_graded` yang diperlukan oleh salah satu alur notifikasi.

---

## Investigasi dan Rangkaian Perbaikan (Iteratif)

Proses perbaikan ini bersifat sangat iteratif, di mana setiap perbaikan membuka lapisan masalah baru yang lebih dalam.

### Iterasi 1-4: Menyelaraskan Skema `user_progress`
*   **Gejala**: Error awal berkisar dari kolom yang hilang (`class_exercise_id`, `status`) hingga kegagalan `ON CONFLICT` karena *primary key* yang salah pada tabel `user_progress`.
*   **Tindakan Perbaikan**: Melalui serangkaian migrasi dari `20250720170000` hingga `20250720230000`, skema tabel `exercise_attempts` dan `user_progress` secara bertahap diselaraskan, dan fungsi trigger `handle_exercise_attempt_update` ditulis ulang agar sesuai dengan skema yang benar.
*   **Hasil**: Error terkait `user_progress` teratasi, namun ini mengungkap error baru yang lebih mendasar.

### Iterasi 5: Error `column "link" of relation "notifications" does not exist`
*   **Analisis**: Ini adalah error yang paling persisten. Setelah semua skema progress diperbaiki, error ini menunjukkan bahwa ada logika notifikasi yang salah. Investigasi awal pada trigger yang terdokumentasi (`notify_on_attempt_completion`) tidak langsung menunjukkan masalah.
*   **Tindakan Perbaikan**:
    1.  Membuat migrasi `20250720230500_fix_notification_trigger_error.sql` untuk memperbaiki fungsi `create_notification` yang salah.
    2.  Migrasi ini gagal karena adanya *dependency* dari trigger lain.
    3.  Memperbaiki migrasi untuk `DROP TRIGGER` terlebih dahulu.
*   **Hasil**: Error tetap ada, membuktikan bahwa ada lebih dari satu trigger yang salah.

### Iterasi 6: Menemukan Trigger Tersembunyi
*   **Analisis**: Setelah semua trigger yang terdokumentasi diperiksa, kecurigaan beralih ke fungsi-fungsi lain yang disebutkan dalam `backendContext.md`. Ditemukanlah `handle_notification_creation()`, sebuah fungsi terpusat yang tidak terdokumentasi dalam file migrasi.
*   **Tindakan Perbaikan**:
    1.  Meminta source code fungsi `handle_notification_creation` langsung dari database menggunakan query `pg_get_functiondef`.
    2.  Source code tersebut mengkonfirmasi bahwa fungsi ini mengandung banyak `INSERT` ke tabel `notifications` yang semuanya menyertakan kolom `link` yang salah.
    3.  Membuat migrasi komprehensif `20250720232000_remove_link_from_central_notification_trigger.sql` untuk menghapus semua trigger yang bergantung pada fungsi ini, menulis ulang fungsi tersebut tanpa kolom `link`, dan kemudian membuat ulang semua trigger.
*   **Hasil**: Error `column "link" does not exist` akhirnya hilang.

### Iterasi 7: Error `invalid input value for enum notification_type: "assignment_graded"`
*   **Analisis**: Dengan hilangnya error `link`, error baru yang lebih sederhana muncul. Ini menunjukkan bahwa fungsi `handle_notification_creation` yang baru saja diperbaiki mencoba menggunakan tipe notifikasi `assignment_graded`, tetapi nilai ini tidak ada dalam `ENUM` `notification_type`.
*   **Tindakan Perbaikan**:
    1.  Memeriksa file migrasi `20250716120000_add_type_to_notifications.sql` untuk mengkonfirmasi definisi `ENUM`.
    2.  Membuat migrasi final dan sederhana, `20250720232500_add_graded_to_notification_enum.sql`, yang hanya menambahkan nilai `assignment_graded` ke `ENUM` `notification_type`.
*   **Hasil Akhir**: Semua error berhasil diatasi. Proses pengiriman latihan siswa sekarang berfungsi dengan benar dari awal hingga akhir.

---

## Kesimpulan dan Referensi Inti

Kasus ini menyoroti pentingnya menjaga sinkronisasi antara dokumentasi, file migrasi, dan keadaan database yang sebenarnya. Akar masalah dari bug yang sangat persisten ini adalah adanya fungsi trigger terpusat yang tidak terdokumentasi dan sudah usang.

*   **File Inti Masalah (Tidak Terdokumentasi):** Fungsi `public.handle_notification_creation()` yang ada di database tetapi tidak dalam migrasi.
*   **File Perbaikan Definitif:**
    1.  `supabase/migrations/20250720232000_remove_link_from_central_notification_trigger.sql` (Memperbaiki fungsi terpusat)
    2.  `supabase/migrations/20250720232500_add_graded_to_notification_enum.sql` (Memperbaiki ENUM yang hilang)
