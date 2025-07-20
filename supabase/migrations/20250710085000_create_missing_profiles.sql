-- This script ensures that every user in auth.users has a corresponding profile in public.profiles.
-- It's designed to fix inconsistencies for users created before the profile-creation trigger was active.

INSERT INTO public.profiles (id, full_name, avatar_url, role)
SELECT
    u.id,
    u.raw_user_meta_data->>'full_name' AS full_name,
    u.raw_user_meta_data->>'avatar_url' AS avatar_url,
    COALESCE(u.raw_user_meta_data->>'role', 'student') AS role
FROM
    auth.users u
LEFT JOIN
    public.profiles p ON u.id = p.id
WHERE
    p.id IS NULL; -- Only insert if the profile does not already exist
