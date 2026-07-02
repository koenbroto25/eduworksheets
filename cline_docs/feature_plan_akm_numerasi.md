# Rencana Pengembangan Fitur: Soal Literasi Numerasi Berbasis AKM

Dokumen ini berisi rencana untuk mengembangkan dan mengimplementasikan jenis soal baru yang berfokus pada literasi numerasi, dengan format yang terinspirasi oleh Asesmen Kompetensi Minimum (AKM).

## Latar Belakang

Ada kebutuhan untuk menyediakan konten latihan yang tidak hanya menguji kemampuan komputasi matematika siswa, tetapi juga kemampuan mereka untuk bernalar, menganalisis data, dan menerapkan konsep matematika dalam konteks dunia nyata. Format soal AKM yang menggunakan stimulus (bacaan, grafik, tabel) adalah model yang ideal untuk tujuan ini.

## Konsep Fitur

Fitur ini akan memungkinkan pembuatan dan penyajian soal-soal yang terdiri dari:
1.  **Stimulus:** Sebuah blok konten yang bisa berisi teks cerita, infografis, tabel, atau diagram.
2.  **Serangkaian Pertanyaan:** 5 hingga 10 pertanyaan yang terkait langsung dengan stimulus yang diberikan.
3.  **Beragam Tipe Soal:** Mendukung tipe soal seperti pilihan ganda, pilihan ganda kompleks, benar/salah, isian singkat, dan uraian.

## Contoh Implementasi Awal

Berikut adalah contoh konten yang akan digunakan sebagai prototipe awal.

### **Tema: Festival Kuliner Kelas 5**

**Tujuan:** Mengukur kemampuan siswa dalam memahami data, menghitung biaya dan keuntungan, menginterpretasi diagram, serta membuat keputusan berdasarkan informasi numerik.

---

### **Stimulus (Materi Bacaan)**

Siswa akan diberikan sebuah cerita pengantar disertai dengan infografis dan tabel.

**Teks Cerita:**

> "Dalam rangka merayakan hari kemerdekaan, siswa-siswi Kelas 5 SDN Ceria akan mengadakan acara 'Festival Kuliner'. Mereka berencana menjual tiga jenis makanan dan minuman: Bakso Kuah, Es Teh Manis, dan Puding Cokelat.
>
> Untuk mempersiapkan acara ini, mereka membuat rincian modal (biaya bahan baku) dan harga jual per porsi. Selain itu, mereka juga melihat data penjualan dari festival tahun lalu untuk memprediksi makanan apa yang paling laku."

**Infografis 1: Rincian Biaya dan Harga Jual**

| Nama Produk | Modal per Porsi | Harga Jual per Porsi |
| :--- | :--- | :--- |
| Bakso Kuah | Rp 8.000 | Rp 12.000 |
| Es Teh Manis | Rp 2.000 | Rp 4.000 |
| Puding Cokelat | Rp 3.500 | Rp 5.000 |

**Infografis 2: Diagram Batang Hasil Penjualan Tahun Lalu**

*(Diagram batang sederhana yang menunjukkan jumlah porsi terjual untuk setiap item: Bakso Kuah (50 porsi), Es Teh Manis (80 porsi), Puding Cokelat (65 porsi))*

---

### **Contoh Pertanyaan**

1.  **(Memahami Informasi)** Berdasarkan tabel, berapa rupiah keuntungan yang didapat dari menjual satu porsi Puding Cokelat?
    *   *Konsep: Pengurangan, membaca tabel.*

2.  **(Aplikasi Langsung)** Jika kelas 5 berhasil menjual 30 porsi Bakso Kuah, berapa total keuntungan yang mereka peroleh dari penjualan bakso saja?
    *   *Konsep: Perkalian, pengurangan.*

3.  **(Analisis Data)** Perhatikan diagram batang hasil penjualan tahun lalu. Manakah pernyataan yang **benar**?
    *   A. Es Teh Manis adalah produk yang paling tidak laku.
    *   B. Penjualan Bakso Kuah lebih sedikit 15 porsi dibandingkan Puding Cokelat.
    *   C. Total ada lebih dari 200 porsi yang terjual tahun lalu.
    *   D. Produk yang paling laku adalah Es Teh Manis.
    *   *Konsep: Interpretasi diagram batang.*

4.  **(Penalaran Kompleks - Pilihan Ganda Kompleks)** Kelas 5 memiliki target keuntungan total sebesar Rp 400.000. Manakah skenario penjualan di bawah ini yang memungkinkan mereka mencapai target? (Jawaban bisa lebih dari satu)
    *   [ ] Menjual 40 Bakso, 50 Es Teh, dan 40 Puding.
    *   [ ] Menjual 30 Bakso, 80 Es Teh, dan 50 Puding.
    *   [ ] Menjual 50 Bakso, 20 Es Teh, dan 20 Puding.
    *   *Konsep: Operasi hitung campuran, analisis, problem solving.*

5.  **(Penalaran dan Evaluasi - Uraian)** Melihat data keuntungan per porsi dan data penjualan tahun lalu, ketua kelas menyarankan untuk memperbanyak stok Es Teh Manis karena paling laku. Namun, bendahara kelas menyarankan untuk memperbanyak stok Bakso Kuah karena keuntungannya paling besar.
    Menurutmu, saran siapa yang lebih baik untuk memaksimalkan keuntungan total? Berikan alasanmu berdasarkan data yang ada!
    *   *Konsep: Analisis kritis, membandingkan data, argumentasi.*

## Langkah Selanjutnya

1.  **Analisis Teknis:** Menganalisis bagaimana struktur data soal saat ini (`exercises` dan `questions`) dapat dimodifikasi untuk mendukung format stimulus + pertanyaan.
2.  **Desain UI/UX:** Merancang antarmuka bagi guru/pembuat soal untuk membuat paket soal AKM ini, dan antarmuka bagi siswa untuk mengerjakannya.
3.  **Pengembangan Backend:** Implementasi logika di sisi server dan database.
4.  **Pengembangan Frontend:** Implementasi komponen UI di sisi klien.
5.  **Testing:** Pengujian fungsionalitas dan konten.
