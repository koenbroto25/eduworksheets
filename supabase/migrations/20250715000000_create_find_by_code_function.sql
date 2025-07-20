CREATE OR REPLACE FUNCTION find_by_code(search_code TEXT)
RETURNS TABLE(result_type TEXT, result_data JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Search in the classes table
    RETURN QUERY
    SELECT 'class' AS result_type, to_jsonb(c) AS result_data
    FROM classes c
    WHERE UPPER(c.class_code) = UPPER(search_code);

    IF FOUND THEN
        RETURN;
    END IF;

    -- Search in the users table
    RETURN QUERY
    SELECT 'user' AS result_type, to_jsonb(u) AS result_data
    FROM users u
    WHERE UPPER(u.child_code) = UPPER(search_code);

    RETURN;
END;
$$;
