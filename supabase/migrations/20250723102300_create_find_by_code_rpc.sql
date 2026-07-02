-- Drop the function if it exists to ensure a clean re-creation
DROP FUNCTION IF EXISTS public.find_by_code(text);

-- Re-create the function with best practices for SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.find_by_code(p_code text)
RETURNS json
-- VOLATILITY: STABLE indicates the function cannot modify the database and returns the same result for the same inputs within a single transaction.
-- This is a performance hint for the query planner.
STABLE
-- SECURITY DEFINER: The function will be executed with the privileges of the user that created it, bypassing the calling user's RLS.
SECURITY DEFINER
-- SEARCH PATH: Explicitly set the search path to prevent potential hijacking by malicious users who might create objects in other schemas.
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    class_details json;
BEGIN
    SELECT row_to_json(c)
    INTO class_details
    FROM public.classes c
    -- Use regexp_replace to strip all whitespace characters for the most robust comparison.
    WHERE regexp_replace(UPPER(c.class_code), '\s+', '', 'g') = regexp_replace(UPPER(p_code), '\s+', '', 'g')
    LIMIT 1;

    IF FOUND THEN
        -- Wrap the class details in an object with a 'type' field, as the frontend expects.
        RETURN json_build_object('type', 'class', 'details', class_details);
    ELSE
        -- Return null if no class is found.
        RETURN NULL;
    END IF;
END;
$$;
