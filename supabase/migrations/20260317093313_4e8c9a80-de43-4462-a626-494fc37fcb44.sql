
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ref_code text;
  referrer_user_id uuid;
  bdate date;
BEGIN
  -- Parse birth_date from metadata
  BEGIN
    bdate := (NEW.raw_user_meta_data->>'birth_date')::date;
  EXCEPTION WHEN OTHERS THEN
    bdate := NULL;
  END;

  INSERT INTO public.profiles (user_id, display_name, client_code, referral_code, birth_date)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    public.generate_client_code(),
    public.generate_referral_code(),
    bdate
  )
  ON CONFLICT (user_id) DO NOTHING;

  ref_code := NEW.raw_user_meta_data->>'referral_code';
  IF ref_code IS NOT NULL AND ref_code != '' THEN
    SELECT user_id INTO referrer_user_id FROM public.profiles WHERE referral_code = ref_code;
    IF referrer_user_id IS NOT NULL AND referrer_user_id != NEW.id THEN
      INSERT INTO public.referrals (referrer_id, referred_id)
      VALUES (referrer_user_id, NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
