UPDATE public.profiles p
SET display_name = COALESCE(
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'name',
  p.display_name
)
FROM auth.users u
WHERE p.user_id = u.id
AND p.display_name = u.email
AND (u.raw_user_meta_data->>'full_name' IS NOT NULL OR u.raw_user_meta_data->>'name' IS NOT NULL);