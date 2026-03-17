
-- Ensure the trigger is actually attached to the profiles table
DROP TRIGGER IF EXISTS enforce_profile_update ON public.profiles;
CREATE TRIGGER enforce_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_profile_update();
