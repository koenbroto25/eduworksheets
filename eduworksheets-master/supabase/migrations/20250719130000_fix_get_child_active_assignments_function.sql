CREATE OR REPLACE FUNCTION get_child_active_assignments(p_child_id uuid)
RETURNS TABLE(
    assignment_type text,
    exercise_id uuid,
    exercise_title text,
    assigner_name text,
    assigned_at timestamptz,
    due_date timestamptz,
    class_id uuid,
    class_exercise_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_parent_id uuid;
    is_linked boolean;
BEGIN
    v_parent_id := auth.uid();

    -- Validate that the calling user is the parent of the specified child
    SELECT EXISTS (
        SELECT 1
        FROM parent_child_link
        WHERE parent_child_link.parent_id = v_parent_id
          AND parent_child_link.child_id = p_child_id
    ) INTO is_linked;

    IF NOT is_linked THEN
        RETURN;
    END IF;

    RETURN QUERY
    -- 1. Assignments from Parents
    SELECT
        'parent'::text AS assignment_type,
        pa.exercise_id,
        e.title AS exercise_title,
        'Dari Anda (Orang Tua)'::text AS assigner_name,
        pa.assigned_at,
        NULL::timestamptz AS due_date,
        NULL::uuid AS class_id,
        NULL::uuid AS class_exercise_id
    FROM
        parent_assignments pa
    JOIN
        exercises e ON pa.exercise_id = e.id
    LEFT JOIN
        user_progress up ON pa.child_id = up.user_id 
                        AND pa.exercise_id = up.exercise_id 
                        AND up.class_id IS NULL
    WHERE
        pa.child_id = p_child_id
        AND up.id IS NULL

    UNION ALL

    -- 2. Assignments from Teachers via Classes
    SELECT
        'class'::text AS assignment_type,
        ce.exercise_id,
        e.title AS exercise_title,
        COALESCE(usr.name, 'Guru') || ' (' || c.name || ')' AS assigner_name,
        ce.assigned_at,
        ce.due_date,
        c.id AS class_id,
        ce.id AS class_exercise_id
    FROM
        class_students cs
    JOIN
        class_exercises ce ON cs.class_id = ce.class_id
    JOIN
        classes c ON ce.class_id = c.id
    JOIN
        exercises e ON ce.exercise_id = e.id
    JOIN
        users usr ON c.teacher_id = usr.id -- FIX: Changed 'profiles' to 'users' and alias to 'usr'
    LEFT JOIN
        user_progress up ON cs.student_id = up.user_id 
                        AND ce.exercise_id = up.exercise_id 
                        AND ce.class_id = up.class_id
    WHERE
        cs.student_id = p_child_id
        AND up.id IS NULL;

END;
$$;
