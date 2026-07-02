DO $x$ BEGIN
    CREATE TYPE public.notification_type AS ENUM (
        'assignment_new',
        'assignment_completed_passed',
        'assignment_completed_failed',
        'assignment_overdue',
        'class_join'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $x$;

ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS type notification_type;