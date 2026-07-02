-- Step 1 of the definitive fix: Isolate the problem by disabling the faulty trigger.
-- This will stop the "no field 'student_id'" error from occurring.
-- Notifications for new assignments will be temporarily disabled until the replacement trigger is created.

ALTER TABLE public.class_exercises DISABLE TRIGGER on_new_assignment_trigger;
