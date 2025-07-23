-- This script checks the status of triggers on the 'class_exercises' table.
-- It helps diagnose issues related to duplicate or faulty triggers.
-- This version uses pg_trigger for more detailed and accurate status information.

SELECT
    tgname AS trigger_name,
    tgtype AS trigger_type,
    tgenabled AS status,
    proname AS function_name
FROM
    pg_trigger
JOIN
    pg_class ON pg_trigger.tgrelid = pg_class.oid
JOIN
    pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE
    pg_class.relname = 'class_exercises';
