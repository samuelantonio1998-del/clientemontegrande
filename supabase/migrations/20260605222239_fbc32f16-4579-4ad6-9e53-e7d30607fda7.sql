CREATE OR REPLACE FUNCTION public.attach_referral(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer uuid;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthenticated');
  END IF;
  IF _code IS NULL OR _code = '' THEN
    RETURN jsonb_build_object('error', 'invalid_code');
  END IF;

  SELECT user_id INTO v_referrer FROM public.profiles WHERE referral_code = _code;
  IF v_referrer IS NULL THEN
    RETURN jsonb_build_object('error', 'referrer_not_found');
  END IF;
  IF v_referrer = v_uid THEN
    RETURN jsonb_build_object('error', 'self_referral');
  END IF;

  INSERT INTO public.referrals (referrer_id, referred_id)
  VALUES (v_referrer, v_uid)
  ON CONFLICT (referred_id) DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.attach_referral(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.attach_referral(text) FROM anon, public;