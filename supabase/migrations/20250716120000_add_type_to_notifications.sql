CREATE TYPE public.notification_type AS ENUM (
    'assignment_new',
    'assignment_completed_passed',
    'assignment_completed_failed',
    'assignment_overdue',
    'class_join'
);

ALTER TABLE public.notifications
ADD COLUMN type notification_type;
