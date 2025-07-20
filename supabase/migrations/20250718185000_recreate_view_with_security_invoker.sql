-- Step 1: Drop the previous, incorrect view and its policies.
DROP VIEW IF EXISTS public.classes_with_student_count;
-- The policies were on the view, so dropping the view removes them.

-- Step 2: Recreate the view with the correct 'security_invoker' option.
-- This tells PostgreSQL to use the RLS policies of the underlying tables
-- (classes, class_students) as the user who is calling the view.
-- This is the standard and correct way to solve this recursion issue.
CREATE OR REPLACE VIEW public.classes_with_student_count
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.created_at,
  c.name,
  c.description,
  c.teacher_id,
  c.class_code,
  c.is_active,
  (SELECT count(*) FROM public.class_students cs WHERE cs.class_id = c.id) as student_count
FROM
  public.classes c;
