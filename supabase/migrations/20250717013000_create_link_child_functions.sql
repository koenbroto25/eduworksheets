-- Fungsi untuk mencari anak berdasarkan kode unik
-- Menggunakan SECURITY DEFINER untuk melewati RLS dan mencari di seluruh tabel users
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

-- Fungsi untuk menautkan orang tua ke anak
create or replace function link_parent_to_child(p_parent_id uuid, p_child_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Memastikan bahwa yang menjalankan adalah parent yang benar atau admin
  if auth.uid() != p_parent_id and not is_admin(auth.uid()) then
    raise exception 'Unauthorized';
  end if;

  -- Memasukkan data ke tabel penautan
  insert into public.parent_child_link (parent_id, child_id)
  values (p_parent_id, p_child_id);
end;
$$;
