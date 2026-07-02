# Daftar semua mata pelajaran
$subjects = @(
    "Pendidikan Agama Khonghucu dan Budi Pekerti",
    "Bahasa Indonesia",
    "Ilmu Pengetahuan Sosial (IPS)",
    "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)",
    "Seni Budaya dan Prakarya (SBdP)",
    "Bimbingan Konseling (BK)",
    "Ilmu Pengetahuan Alam (IPA)",
    "Bahasa Inggris",
    "Seni Budaya",
    "Prakarya",
    "Fisika",
    "Kimia",
    "Biologi",
    "Sejarah",
    "Geografi",
    "Ekonomi",
    "Sosiologi",
    "Prakarya dan Kewirausahaan",
    "Simulasi Digital",
    "Teknik Gambar Bangunan",
    "Teknik Konstruksi Kayu",
    "Teknik Instalasi Tenaga Listrik",
    "Teknik Pendingin dan Tata Udara",
    "Teknik Pemesinan",
    "Teknik Kendaraan Ringan Otomotif",
    "Teknik Sepeda Motor",
    "Teknik Komputer dan Jaringan",
    "Desain Pemodelan dan Informasi Bangunan",
    "Akuntansi dan Keuangan Lembaga",
    "Otomatisasi dan Tata Kelola Perkantoran",
    "Bisnis Daring dan Pemasaran",
    "Tata Boga",
    "Tata Busana",
    "Tata Kecantikan Kulit dan Rambut",
    "Agribisnis Tanaman Pangan dan Hortikultura",
    "Agribisnis Ternak Unggas",
    "Agribisnis Pengolahan Hasil Pertanian",
    "Teknik Audio Video",
    "Teknik Elektronika Industri",
    "Teknik Fabrikasi Logam dan Manufaktur",
    "Teknik Geomatika",
    "Teknik Kimia Industri",
    "Teknik Otomasi Industri",
    "Teknik Pembangkit Tenaga Listrik",
    "Teknik Pemesinan Kapal",
    "Teknik Pengelasan Kapal",
    "Teknik Perawatan Mesin Kapal",
    "Teknik Perbaikan Bodi Otomotif",
    "Teknik Produksi Grafika",
    "Teknik Rekayasa Perangkat Lunak",
    "Teknik Robotika dan Mekatronika"
)

# Membuat folder jika belum ada
$curriculumPath = "src\data\curriculum"
if (-not (Test-Path -Path $curriculumPath)) {
    New-Item -ItemType Directory -Path $curriculumPath
}

# Loop untuk membuat setiap file JSON
foreach ($subject in $subjects) {
    $fileName = $subject.ToLower().Replace(" ", "_").Replace("(", "").Replace(")", "").Replace(",", "")
    $filePath = Join-Path -Path $curriculumPath -ChildPath "$fileName.json"
    $jsonContent = @"
{
  "subject": "$subject",
  "grades": []
}
"@
    Set-Content -Path $filePath -Value $jsonContent -Encoding utf8
    Write-Host "Created $filePath"
}

Write-Host "Selesai membuat semua file JSON di folder $curriculumPath"
