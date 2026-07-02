CREATE OR REPLACE FUNCTION get_enum_values(enum_name text)
RETURNS text[] AS $$
DECLARE
    values text[];
BEGIN
    SELECT array_agg(e.enumlabel)
    INTO values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = enum_name;
    RETURN values;
END;
$$ LANGUAGE plpgsql;
