-- This script populates the class_members table based on the existing teacher_id in the classes table.
-- It ensures that every teacher is registered as a 'teacher' in their respective classes.

INSERT INTO public.class_members (class_id, user_id, role)
SELECT
    id AS class_id,
    teacher_id AS user_id,
    'teacher' AS role
FROM
    public.classes
WHERE
    teacher_id IS NOT NULL
ON CONFLICT (class_id, user_id) DO NOTHING;

-- This will prevent duplicate entries if the script is run multiple times.
