
-- Add buffet_available column
ALTER TABLE public.profiles ADD COLUMN buffet_available boolean NOT NULL DEFAULT false;

-- Create trigger to auto-set buffet_available when points >= 200
CREATE OR REPLACE FUNCTION public.check_buffet_eligibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.total_points >= 200 AND NOT NEW.buffet_available THEN
    NEW.buffet_available := true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_buffet
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_buffet_eligibility();
