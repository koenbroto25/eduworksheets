CREATE TYPE public.question_type_enum AS ENUM (
    'multiple-choice',
    'short-answer',
    'connecting-lines',
    'sequencing',
);

ALTER TABLE public.exercises
ALTER COLUMN question_types TYPE public.question_type_enum[]
USING (question_types::text[]::public.question_type_enum[]);
