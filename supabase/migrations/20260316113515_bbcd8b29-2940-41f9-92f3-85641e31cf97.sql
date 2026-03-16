
-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Generate referral codes for existing profiles
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
  code_exists boolean;
BEGIN
  LOOP
    result := 'REF-';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = result) INTO code_exists;
    IF NOT code_exists THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$;

-- Fill existing profiles with referral codes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE referral_code IS NULL LOOP
    UPDATE public.profiles SET referral_code = public.generate_referral_code() WHERE id = r.id;
  END LOOP;
END;
$$;

-- Create referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL UNIQUE,
  meals_counted integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can see their own referrals (as referrer)
CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (referrer_id = auth.uid());

-- Admins can read all
CREATE POLICY "Admins can read all referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- System inserts only (via trigger/function)
CREATE POLICY "System can insert referrals" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (referred_id = auth.uid());

-- Update handle_new_user to include referral_code and referral tracking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ref_code text;
  referrer_user_id uuid;
BEGIN
  INSERT INTO public.profiles (user_id, display_name, client_code, referral_code)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    public.generate_client_code(),
    public.generate_referral_code()
  );

  -- Check if user was referred
  ref_code := NEW.raw_user_meta_data->>'referral_code';
  IF ref_code IS NOT NULL AND ref_code != '' THEN
    SELECT user_id INTO referrer_user_id FROM public.profiles WHERE referral_code = ref_code;
    IF referrer_user_id IS NOT NULL AND referrer_user_id != NEW.id THEN
      INSERT INTO public.referrals (referrer_id, referred_id)
      VALUES (referrer_user_id, NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: when a meal transaction is inserted, award referral points
CREATE OR REPLACE FUNCTION public.handle_referral_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ref RECORD;
BEGIN
  -- Only process meal-type transactions
  IF NEW.type != 'meal' THEN
    RETURN NEW;
  END IF;

  -- Check if this user was referred and referrer still has < 10 meals counted
  SELECT * INTO ref FROM public.referrals
    WHERE referred_id = NEW.user_id AND meals_counted < 10;

  IF FOUND THEN
    -- Increment meals counted
    UPDATE public.referrals SET meals_counted = meals_counted + 1 WHERE id = ref.id;

    -- Award 2.5 points to referrer (stored as integer, so we add 3 for odd, 2 for even to average 2.5)
    UPDATE public.profiles SET total_points = total_points + 3 WHERE user_id = ref.referrer_id;

    -- Log the referral points transaction
    INSERT INTO public.transactions (user_id, amount, points_earned, type, description)
    VALUES (ref.referrer_id, 0, 3, 'referral', 'Pontos de referência');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_meal_referral_points
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_referral_points();
