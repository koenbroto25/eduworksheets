-- Migration: Fix Teacher Class Exercises RPC
-- Date: 2025-07-20
--
-- This migration updates the `get_teacher_class_exercises` function to align with
-- the new progress tracking architecture introduced in migration `20250720120000`.
--
-- The original function incorrectly queried the `user_progress` table and its
-- now-deleted `class_id` column. This fix redirects the subquery to the new
-- `class_assignment_progress` table to correctly count student submissions.

CREATE OR REPLACE FUNCTION public.get_teacher_class_exercises(p_class_id uuid)
RETURNS TABLE(
    id uuid,
    exercise_id uuid,
    exercise_title text,
    assigned_at timestamptz,
    due_date timestamptz,
    student_submissions bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_teacher_id uuid;
BEGIN
    -- Get the ID of the currently logged-in user
    v_teacher_id := auth.uid();

    -- Validate that the calling user is the teacher of the specified class
    IF NOT EXISTS (
        SELECT 1
        FROM classes
        WHERE classes.id = p_class_id
          AND classes.teacher_id = v_teacher_id
    ) THEN
        -- If not the legitimate teacher, return an empty table
        RETURN;
    END IF;

    -- Return all exercises for the given class, with the corrected submission count
    RETURN QUERY
    SELECT
        ce.id,
        ce.exercise_id,
        e.title AS exercise_title,
        ce.assigned_at,
        ce.due_date,
        (
            -- CORRECTED SUBQUERY:
            -- Counts distinct students from the new `class_assignment_progress` table,
            -- correctly linking via `class_exercise_id`.
            SELECT COUNT(DISTINCT cap.student_id)
            FROM class_assignment_progress cap
            WHERE cap.class_exercise_id = ce.id
        ) AS student_submissions
    FROM
        class_exercises ce
    JOIN
        exercises e ON ce.exercise_id = e.id
    WHERE
        ce.class_id = p_class_id
    ORDER BY
        ce.assigned_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_teacher_class_exercises(uuid) IS 'Fetches all exercises for a class, including a correct count of student submissions from the class_assignment_progress table. For teacher use only.';
