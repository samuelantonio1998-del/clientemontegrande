
-- Fix 1: Restrict follow_claims columns - add trigger to prevent non-admin users from modifying sensitive columns
CREATE OR REPLACE FUNCTION public.restrict_follow_claims_update()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' OR
     current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
    NEW.points_awarded := OLD.points_awarded;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.user_id := OLD.user_id;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_restrict_follow_claims_update
  BEFORE UPDATE ON public.follow_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_follow_claims_update();
