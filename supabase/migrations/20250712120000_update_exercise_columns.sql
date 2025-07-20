-- Temporarily disable trigger validation for the whole transaction
SET session_replication_role = 'replica';

-- Drop existing constraints if they exist to prevent errors on re-run
ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS check_subject_values;
ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS check_grade_values;
ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS check_assessment_type_values;

-- Safely manage curriculum_type enum
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'curriculum_type') THEN
        ALTER TYPE public.curriculum_type RENAME TO curriculum_type_old;
    END IF;
END$$;

CREATE TYPE public.curriculum_type AS ENUM (
    'Kurikulum Merdeka Belajar',
    'Kurikulum Deep Learning',
    'Cambridge International Curriculum (CAIE)',
    'International Baccalaureate (IB)'
);

-- Alter the column to use the new type, correcting the typo during the cast
ALTER TABLE public.exercises 
ALTER COLUMN curriculum_type TYPE public.curriculum_type 
USING REPLACE(curriculum_type::text, 'Kurikulum Deep LEarning', 'Kurikulum Deep Learning')::public.curriculum_type;

DO $$
BEGIN
    DROP TYPE public.curriculum_type_old;
EXCEPTION
    WHEN UNDEFINED_OBJECT THEN
        -- The old type might not exist if this is the first run
END$$;

-- Update non-compliant grade data to a default value
UPDATE public.exercises
SET grade = 'Grade 1 (SD)'
WHERE grade IS NULL OR grade NOT IN (
    'Grade 1 (SD)', 'Grade 2 (SD)', 'Grade 3 (SD)', 'Grade 4 (SD)', 'Grade 5 (SD)', 'Grade 6 (SD)', 'Grade 7 (SMP)', 'Grade 8 (SMP)', 'Grade 9 (SMP)', 'Grade 10 (SMA)', 'Grade 11 (SMA)', 'Grade 12 (SMA)', 'Grade 10 (SMK)', 'Grade 11 (SMK)', 'Grade 12 (SMK)'
);

-- Update non-compliant assessment_type data to a default value
UPDATE public.exercises
SET assessment_type = 'Latihan Soal (Exercise/Drill)'
WHERE assessment_type IS NULL OR assessment_type NOT IN (
    'Latihan Soal (Exercise/Drill)', 'Kuis (Quiz)', 'Tugas (Assignment)', 'Ulangan Harian (Daily Test)', 'Penilaian Tengah Semester (Mid-term Exam)', 'Penilaian Akhir Semester (Final Exam)', 'ANBK', 'Ujian Sekolah (US)', 'UTBK-SNBT'
);

-- Add all check constraints
ALTER TABLE public.exercises
ADD CONSTRAINT check_subject_values
CHECK (subject IN (
    'Pendidikan Agama Islam dan Budi Pekerti', 'Pendidikan Agama Kristen dan Budi Pekerti', 'Pendidikan Agama Katolik dan Budi Pekerti', 'Pendidikan Agama Hindu dan Budi Pekerti', 'Pendidikan Agama Buddha dan Budi Pekerti', 'Pendidikan Agama Khonghucu dan Budi Pekerti', 'Bahasa Indonesia', 'Matematika', 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', 'Ilmu Pengetahuan Sosial (IPS)', 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', 'Seni Budaya dan Prakarya (SBdP)', 'Bimbingan Konseling (BK)', 'Pendidikan Pancasila', 'Ilmu Pengetahuan Alam (IPA)', 'Bahasa Inggris', 'Seni Budaya', 'Prakarya', 'Fisika', 'Kimia', 'Biologi', 'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi', 'Prakarya dan Kewirausahaan', 'Simulasi Digital'
));

ALTER TABLE public.exercises
ADD CONSTRAINT check_grade_values
CHECK (grade IN (
    'Grade 1 (SD)', 'Grade 2 (SD)', 'Grade 3 (SD)', 'Grade 4 (SD)', 'Grade 5 (SD)', 'Grade 6 (SD)', 'Grade 7 (SMP)', 'Grade 8 (SMP)', 'Grade 9 (SMP)', 'Grade 10 (SMA)', 'Grade 11 (SMA)', 'Grade 12 (SMA)', 'Grade 10 (SMK)', 'Grade 11 (SMK)', 'Grade 12 (SMK)'
));

ALTER TABLE public.exercises
ADD CONSTRAINT check_assessment_type_values
CHECK (assessment_type IN (
    'Latihan Soal (Exercise/Drill)', 'Kuis (Quiz)', 'Tugas (Assignment)', 'Ulangan Harian (Daily Test)', 'Penilaian Tengah Semester (Mid-term Exam)', 'Penilaian Akhir Semester (Final Exam)', 'ANBK', 'Ujian Sekolah (US)', 'UTBK-SNBT'
));

-- Add 'semester' column with a new ENUM type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'semester_enum') THEN
        CREATE TYPE semester_enum AS ENUM ('All Semester', 'Semester 1', 'Semester 2');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercises' AND column_name='semester') THEN
        ALTER TABLE public.exercises ADD COLUMN semester semester_enum;
    END IF;
END$$;

-- Add 'question_types' column as a text array
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercises' AND column_name='question_types') THEN
        ALTER TABLE public.exercises ADD COLUMN question_types text[];
    END IF;
END$$;

-- Re-enable trigger validation
SET session_replication_role = 'origin';
