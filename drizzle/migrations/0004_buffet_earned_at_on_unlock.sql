CREATE OR REPLACE FUNCTION public.check_buffet_eligibility()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.total_points >= 200 AND NOT NEW.buffet_available THEN
    NEW.buffet_available := true;
    NEW.buffet_earned_at := now();
  END IF;
  IF NEW.buffet_available AND NOT OLD.buffet_available AND NEW.buffet_earned_at IS NULL THEN
    NEW.buffet_earned_at := now();
  END IF;
  RETURN NEW;
END;
$function$;