BEGIN;

ALTER TABLE public.admin_actions ADD COLUMN IF NOT EXISTS people_count integer NOT NULL DEFAULT 1;

DROP FUNCTION IF EXISTS public.register_meal_atomic(uuid, uuid);

CREATE OR REPLACE FUNCTION public.register_meal_atomic(
  _client_user_id uuid,
  _admin_id uuid,
  _people_count integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_monday date;
  v_recent_meal_count int;
  v_new_meals int;
  v_reached_discount boolean := false;
  v_tx_id uuid;
  v_description text;
  v_points_wanted numeric;
  v_points_to_200 numeric;
  v_points_earned numeric := 0;
BEGIN
  IF _people_count IS NULL OR _people_count < 1 OR _people_count > 20 THEN
    RETURN jsonb_build_object('error', 'invalid_people_count');
  END IF;

  IF NOT public.has_role(_admin_id, 'admin') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  SELECT * INTO v_profile FROM public.profiles
    WHERE user_id = _client_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'client_not_found');
  END IF;

  SELECT COUNT(*) INTO v_recent_meal_count FROM public.transactions
    WHERE user_id = _client_user_id AND type = 'meal'
      AND created_at > now() - interval '20 hours';
  IF v_recent_meal_count > 0 THEN
    RETURN jsonb_build_object('error', 'cooldown_active');
  END IF;

  v_monday := (date_trunc('week', now()))::date;
  IF v_profile.current_week_start IS NULL OR v_profile.current_week_start < v_monday THEN
    v_profile.consecutive_meals := 0;
    v_profile.current_week_start := v_monday;
  END IF;

  v_new_meals := v_profile.consecutive_meals + 1;
  IF v_new_meals >= 4 AND NOT v_profile.discount_available THEN
    v_reached_discount := true;
  END IF;

  IF v_profile.buffet_available THEN
    v_points_earned := 0;
  ELSE
    v_points_wanted := _people_count * 10;
    v_points_to_200 := GREATEST(200 - v_profile.total_points, 0);
    v_points_earned := LEAST(v_points_wanted, v_points_to_200);
  END IF;

  v_description := 'Refeição ' || v_new_meals || '/4';

  INSERT INTO public.transactions (user_id, amount, points_earned, type, description)
  VALUES (_client_user_id, 0, v_points_earned::int, 'meal', v_description)
  RETURNING id INTO v_tx_id;

  UPDATE public.profiles
    SET consecutive_meals = v_new_meals,
        current_week_start = v_profile.current_week_start,
        total_points = total_points + v_points_earned,
        discount_available = CASE WHEN v_reached_discount THEN true ELSE discount_available END,
        discount_earned_at = CASE WHEN v_reached_discount THEN now() ELSE discount_earned_at END,
        updated_at = now()
    WHERE user_id = _client_user_id;

  INSERT INTO public.admin_actions (
    admin_id, client_user_id, client_name, client_code,
    action_type, description, points_changed, transaction_id, people_count
  )
  VALUES (
    _admin_id, _client_user_id, v_profile.display_name, v_profile.client_code,
    'register_meal', v_description, v_points_earned, v_tx_id, _people_count
  );

  RETURN jsonb_build_object(
    'success', true,
    'meals', v_new_meals,
    'reachedDiscount', v_reached_discount,
    'points', v_profile.total_points + v_points_earned,
    'pointsEarned', v_points_earned,
    'peopleCount', _people_count
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_meal_atomic(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_meal_atomic(uuid, uuid, integer) TO service_role;

COMMIT;