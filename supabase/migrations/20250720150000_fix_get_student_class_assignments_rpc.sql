-- Migration: Fix Get Student Class Assignments RPC
-- Date: 2025-07-20
--
-- Description:
-- This migration corrects the `get_student_class_assignments` function, which was
-- causing an error (`column up.class_id does not exist`) after the progress
-- tracking system was refactored.
--
-- The fix involves changing the LEFT JOIN from the obsolete `user_progress` table
-- to the new `class_assignment_progress` table for fetching class-specific
-- assignment status and scores.

CREATE OR REPLACE FUNCTION public.get_student_class_assignments(p_class_id uuid)
RETURNS TABLE(
    id uuid,
    exercise_id uuid,
    exercise_title text,
    assigned_at timestamptz,
    due_date timestamptz,
    status public.progress_status_enum, -- Returning the enum type directly
    score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id uuid;
BEGIN
    v_student_id := auth.uid();

    -- Validate that the calling user is a member of the specified class
    IF NOT EXISTS (
        SELECT 1
        FROM public.class_students
        WHERE class_students.class_id = p_class_id
          AND class_students.student_id = v_student_id
    ) THEN
        RAISE EXCEPTION 'User is not a member of this class';
    END IF;

    -- Return all exercises for the given class with student-specific progress
    RETURN QUERY
    SELECT
        ce.id,
        ce.exercise_id,
        e.title AS exercise_title,
        ce.assigned_at,
        ce.due_date,
        -- Correctly join with class_assignment_progress to get status
        COALESCE(cap.status, 'not_started'::public.progress_status_enum) AS status,
        cap.best_score AS score
    FROM
        public.class_exercises ce
    JOIN
        public.exercises e ON ce.exercise_id = e.id
    LEFT JOIN
        -- CORRECTED JOIN: Use class_assignment_progress for class-specific data
        public.class_assignment_progress cap ON ce.id = cap.class_exercise_id
                                             AND cap.student_id = v_student_id
    WHERE
        ce.class_id = p_class_id
    ORDER BY
        ce.assigned_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_student_class_assignments(uuid) IS 'Fetches all assignments for a student in a specific class, including their progress status. Corrected on 2025-07-20 to align with the new progress tracking architecture.';
