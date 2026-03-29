CREATE OR REPLACE FUNCTION public.restrict_profile_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('role', true) = 'service_role' OR
     current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.total_points := OLD.total_points;
    NEW.consecutive_meals := OLD.consecutive_meals;
    NEW.discount_available := OLD.discount_available;
    NEW.buffet_available := OLD.buffet_available;
    NEW.total_savings := OLD.total_savings;
    NEW.current_week_start := OLD.current_week_start;
    NEW.user_id := OLD.user_id;
    NEW.created_at := OLD.created_at;
    NEW.referral_code := OLD.referral_code;
    NEW.discount_earned_at := OLD.discount_earned_at;
    NEW.buffet_earned_at := OLD.buffet_earned_at;
  END IF;
  RETURN NEW;
END;
$function$;