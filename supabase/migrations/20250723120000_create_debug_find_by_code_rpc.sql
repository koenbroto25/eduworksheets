CREATE OR REPLACE FUNCTION public.debug_find_by_code(p_code text)
RETURNS TABLE(
    raw_db_code text,
    processed_db_code text,
    raw_input_code text,
    processed_input_code text,
    are_equal boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
    class_record classes;
BEGIN
    -- Attempt to find the class to get its raw code
    SELECT *
    INTO class_record
    FROM public.classes
    WHERE UPPER(class_code) = UPPER(p_code) OR class_code = p_code
    LIMIT 1;

    -- If we find a potential match, return the debug info for it
    IF FOUND THEN
        RETURN QUERY
        SELECT
            c.class_code AS raw_db_code,
            regexp_replace(UPPER(c.class_code), '\s+', '', 'g') AS processed_db_code,
            p_code AS raw_input_code,
            regexp_replace(UPPER(p_code), '\s+', '', 'g') AS processed_input_code,
            (regexp_replace(UPPER(c.class_code), '\s+', '', 'g') = regexp_replace(UPPER(p_code), '\s+', '', 'g')) AS are_equal
        FROM public.classes c
        WHERE c.id = class_record.id;
    ELSE
        -- If no potential match is found, return the processed input against a NULL db code
        RETURN QUERY
        SELECT
            NULL::text AS raw_db_code,
            NULL::text AS processed_db_code,
            p_code AS raw_input_code,
            regexp_replace(UPPER(p_code), '\s+', '', 'g') AS processed_input_code,
            false AS are_equal;
    END IF;
END;
$$;
