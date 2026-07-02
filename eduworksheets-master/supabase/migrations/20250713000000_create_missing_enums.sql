CREATE TYPE subject AS ENUM (
    'Pendidikan Agama Islam dan Budi Pekerti',
    'Pendidikan Agama Kristen dan Budi Pekerti',
    'Pendidikan Agama Katolik dan Budi Pekerti',
    'Pendidikan Agama Hindu dan Budi Pekerti',
    'Pendidikan Agama Buddha dan Budi Pekerti',
    'Pendidikan Agama Khonghucu dan Budi Pekerti',
    'Bahasa Indonesia',
    'Matematika',
    'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
    'Ilmu Pengetahuan Sosial (IPS)',
    'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    'Seni Budaya dan Prakarya (SBdP)',
    'Bimbingan Konseling (BK)',
    'Pendidikan Pancasila',
    'Ilmu Pengetahuan Alam (IPA)',
    'Bahasa Inggris',
    'Seni Budaya',
    'Prakarya',
    'Fisika',
    'Kimia',
    'Biologi',
    'Sejarah',
    'Geografi',
    'Ekonomi',
    'Sosiologi',
    'Prakarya dan Kewirausahaan',
    'Simulasi Digital'
);

CREATE TYPE grade AS ENUM (
    'Grade 1 (SD)',
    'Grade 2 (SD)',
    'Grade 3 (SD)',
    'Grade 4 (SD)',
    'Grade 5 (SD)',
    'Grade 6 (SD)',
    'Grade 7 (SMP)',
    'Grade 8 (SMP)',
    'Grade 9 (SMP)',
    'Grade 10 (SMA)',
    'Grade 11 (SMA)',
    'Grade 12 (SMA)',
    'Grade 10 (SMK)',
    'Grade 11 (SMK)',
    'Grade 12 (SMK)'
);

CREATE TYPE assessment_type AS ENUM (
    'Latihan Soal (Exercise/Drill)',
    'Kuis (Quiz)',
    'Tugas (Assignment)',
    'Ulangan Harian (Daily Test)',
    'Penilaian Tengah Semester (Mid-term Exam)',
    'Penilaian Akhir Semester (Final Exam)',
    'ANBK',
    'Ujian Sekolah (US)',
    'UTBK-SNBT'
);

CREATE TYPE semester AS ENUM (
    'All Semester',
    'Semester 1',
    'Semester 2'
);
