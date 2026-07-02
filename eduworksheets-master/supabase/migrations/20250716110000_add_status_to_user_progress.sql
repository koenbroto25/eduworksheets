CREATE TYPE public.progress_status_enum AS ENUM (
    'not_started',
    'in_progress',
    'completed_passed',
    'completed_failed'
);

ALTER TABLE public.user_progress
ADD COLUMN status progress_status_enum NOT NULL DEFAULT 'not_started';
