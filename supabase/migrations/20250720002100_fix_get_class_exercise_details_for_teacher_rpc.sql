-- First, drop the existing function to allow for changing the return signature.
DROP FUNCTION IF EXISTS get_class_exercise_details_for_teacher(UUID, UUID);

-- Then, create the function with the definitive corrected return table definition using the correct ENUM types.
CREATE OR REPLACE FUNCTION get_class_exercise_details_for_teacher(p_class_id UUID, p_exercise_id UUID)
RETURNS TABLE (
    -- Columns from exercises table
    id UUID,
    created_at TIMESTAMPTZ,
    title TEXT,
    description TEXT,
    subject TEXT,
    grade TEXT,
    semester public.semester_enum,
    difficulty public.difficulty_level,
    tags TEXT[],
    is_public BOOLEAN,
    creator_id UUID,
    updated_at TIMESTAMPTZ,
    view_count INT,
    like_count INT,
    minimum_passing_grade INT,
    assessment_type TEXT,
    curriculum_type public.curriculum_type, -- Corrected ENUM type name
    -- Columns from class_exercises table
    class_exercise_id UUID,
    due_date TIMESTAMPTZ,
    max_attempts INT,
    time_limit INT,
    randomize_questions BOOLEAN,
    show_answers_policy public.show_answers_policy_enum,
    is_active BOOLEAN,
    available_from TIMESTAMPTZ,
    available_until TIMESTAMPTZ,
    class_minimum_passing_grade INT,
    -- Aggregated questions
    questions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_teacher_id UUID;
    v_is_teacher_of_class BOOLEAN;
    v_is_exercise_in_class BOOLEAN;
BEGIN
    -- Get the current user's ID from the JWT
    v_teacher_id := auth.uid();

    -- Security Check 1: Verify the caller is the teacher of the specified class.
    SELECT EXISTS (
        SELECT 1
        FROM classes c
        WHERE c.id = p_class_id AND c.teacher_id = v_teacher_id
    ) INTO v_is_teacher_of_class;

    IF NOT v_is_teacher_of_class THEN
        RAISE EXCEPTION 'ACCESS_DENIED: User is not the teacher of this class.';
    END IF;

    -- Security Check 2: Verify the exercise is actually assigned to this class.
    SELECT EXISTS (
        SELECT 1
        FROM class_exercises ce
        WHERE ce.class_id = p_class_id AND ce.exercise_id = p_exercise_id
    ) INTO v_is_exercise_in_class;

    IF NOT v_is_exercise_in_class THEN
        RAISE EXCEPTION 'NOT_FOUND: Exercise is not assigned to this class.';
    END IF;

    -- If all checks pass, return the combined details
    RETURN QUERY
    SELECT
        e.id,
        e.created_at,
        e.title,
        e.description,
        e.subject,
        e.grade,
        e.semester,
        e.difficulty,
        e.tags,
        e.is_public,
        e.creator_id,
        e.updated_at,
        e.view_count,
        e.like_count,
        e.minimum_passing_grade,
        e.assessment_type,
        e.curriculum_type,
        ce.id AS class_exercise_id,
        ce.due_date,
        ce.max_attempts,
        ce.time_limit,
        ce.randomize_questions,
        ce.show_answers_policy,
        ce.is_active,
        ce.available_from,
        ce.available_until,
        ce.minimum_passing_grade AS class_minimum_passing_grade,
        (
            SELECT jsonb_agg(q.*)
            FROM questions q
            WHERE q.exercise_id = e.id
        ) AS questions
    FROM
        exercises e
    JOIN
        class_exercises ce ON e.id = ce.exercise_id
    WHERE
        e.id = p_exercise_id AND ce.class_id = p_class_id;
END;
$$;
