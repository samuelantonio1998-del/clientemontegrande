
-- Convert total_points from integer to numeric to support decimal values
ALTER TABLE public.profiles ALTER COLUMN total_points TYPE numeric USING total_points::numeric;

-- Update referral trigger to award exactly 2.5 points
CREATE OR REPLACE FUNCTION public.handle_referral_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ref RECORD;
BEGIN
  IF NEW.type != 'meal' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO ref FROM public.referrals
    WHERE referred_id = NEW.user_id AND meals_counted < 10;

  IF FOUND THEN
    UPDATE public.referrals SET meals_counted = meals_counted + 1 WHERE id = ref.id;

    UPDATE public.profiles SET total_points = total_points + 2.5 WHERE user_id = ref.referrer_id;

    INSERT INTO public.transactions (user_id, amount, points_earned, type, description)
    VALUES (ref.referrer_id, 0, 3, 'referral', 'Pontos de referência');
  END IF;

  RETURN NEW;
END;
$$;
