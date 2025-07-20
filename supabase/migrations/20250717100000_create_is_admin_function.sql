CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = p_user_id;

  RETURN user_role = 'admin';
END;
$$;
