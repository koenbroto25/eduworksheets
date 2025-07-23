-- This migration adds the 'assignment_graded' value to the 'notification_type' enum.
-- This is the final fix to resolve the student submission error.

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'assignment_graded';
