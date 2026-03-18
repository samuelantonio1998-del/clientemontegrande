DROP POLICY IF EXISTS "Users can update own safe columns" ON public.profiles;

CREATE POLICY "Users can update own safe columns"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND public.check_safe_profile_update(profiles, profiles)
);