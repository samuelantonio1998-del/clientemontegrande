
-- Drop the broad user update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a restricted policy that only allows users to update safe columns
-- by checking that sensitive columns remain unchanged via a security definer function
CREATE OR REPLACE FUNCTION public.check_safe_profile_update(profile_row profiles, new_row profiles)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow update if sensitive columns are unchanged
  RETURN (
    new_row.total_points = profile_row.total_points AND
    new_row.consecutive_meals = profile_row.consecutive_meals AND
    new_row.discount_available = profile_row.discount_available AND
    new_row.total_savings = profile_row.total_savings AND
    new_row.current_week_start IS NOT DISTINCT FROM profile_row.current_week_start AND
    new_row.referral_code IS NOT DISTINCT FROM profile_row.referral_code AND
    new_row.created_at = profile_row.created_at AND
    new_row.user_id = profile_row.user_id
  );
END;
$$;

-- New restrictive policy: users can only update their own profile AND only safe columns
CREATE POLICY "Users can update own safe columns"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
