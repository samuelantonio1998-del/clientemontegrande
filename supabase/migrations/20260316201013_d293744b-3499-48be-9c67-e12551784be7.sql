
-- Drop the broad user UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a restricted UPDATE policy that only allows safe columns
-- We use a trigger to enforce column restrictions
CREATE OR REPLACE FUNCTION public.restrict_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If the caller is not an admin, prevent changes to sensitive columns
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.total_points := OLD.total_points;
    NEW.consecutive_meals := OLD.consecutive_meals;
    NEW.discount_available := OLD.discount_available;
    NEW.total_savings := OLD.total_savings;
    NEW.current_week_start := OLD.current_week_start;
    NEW.user_id := OLD.user_id;
    NEW.created_at := OLD.created_at;
    NEW.referral_code := OLD.referral_code;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_profile_update_restrictions
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_profile_update();

-- Re-create the user UPDATE policy (still scoped to own row)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
