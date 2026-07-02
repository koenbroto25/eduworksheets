-- Menghapus fungsi lama jika ada, untuk menghindari konflik
DROP FUNCTION IF EXISTS find_by_code(text);
DROP FUNCTION IF EXISTS find_child_by_code(text);

-- Membuat ulang fungsi find_child_by_code yang spesifik
create or replace function find_child_by_code(p_code text)
returns table (id uuid, name text, avatar_url text)
language plpgsql
security definer
as $$
begin
  return query
  select u.id, u.name, u.avatar_url
  from public.users u
  where u.child_code = p_code and u.role = 'student'
  limit 1;
end;
$$;

-- Membuat ulang fungsi find_by_code yang lebih umum
CREATE OR REPLACE FUNCTION find_by_code(p_code TEXT)
RETURNS TABLE(result_type TEXT, result_data JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    class_record RECORD;
    user_record RECORD;
BEGIN
    -- Coba cari kelas berdasarkan class_code
    SELECT id, name, description, teacher_id, class_code INTO class_record
    FROM public.classes
    WHERE class_code = p_code AND is_active = TRUE;

    IF FOUND THEN
        result_type := 'class';
        result_data := jsonb_build_object(
            'id', class_record.id,
            'name', class_record.name,
            'description', class_record.description,
            'teacher_id', class_record.teacher_id,
            'class_code', class_record.class_code
        );
        RETURN NEXT;
        RETURN;
    END IF;

    -- Jika tidak ditemukan kelas, coba cari pengguna berdasarkan child_code
    SELECT id, name, role, avatar_url INTO user_record
    FROM public.users
    WHERE child_code = p_code;

    IF FOUND THEN
        result_type := 'user';
        result_data := jsonb_build_object(
            'id', user_record.id,
            'name', user_record.name,
            'role', user_record.role,
            'avatar_url', user_record.avatar_url
        );
        RETURN NEXT;
        RETURN;
    END IF;

    -- Jika tidak ada yang ditemukan
    RETURN;
END;
$$;
