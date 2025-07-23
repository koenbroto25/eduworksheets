-- This migration provides the definitive and final fix for the duplicate assignment error.
-- The root cause was a faulty trigger ('on_new_assignment_trigger') that was being re-enabled
-- by a previous migration, causing two triggers to fire on the same event.

-- Step 1: Explicitly disable the faulty trigger to immediately stop the error.
-- This is redundant as a previous migration already did this, but it ensures the correct state.
ALTER TABLE public.class_exercises DISABLE TRIGGER on_new_assignment_trigger;

-- Step 2: Permanently remove the faulty trigger from the database.
-- This prevents it from ever being re-enabled by mistake and cleans up the database schema.
DROP TRIGGER IF EXISTS on_new_assignment_trigger ON public.class_exercises;

-- The correct trigger, 'trigger_notify_on_new_assignment', which was created in migration
-- 20250722115500, is unaffected and will now be the only trigger handling new assignments.
-- This resolves the conflict and ensures notifications work as intended without errors.
