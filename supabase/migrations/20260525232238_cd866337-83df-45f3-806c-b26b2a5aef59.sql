
CREATE OR REPLACE FUNCTION public.register_meal_atomic(
  _client_user_id uuid,
  _admin_id uuid
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
BEGIN
  -- 1. Authorization
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  -- 2. Lock client profile
  SELECT * INTO v_profile
    FROM public.profiles
    WHERE user_id = _client_user_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'client_not_found');
  END IF;

  -- 3. Cooldown: no meal in last 20h
  SELECT COUNT(*) INTO v_recent_meal_count
    FROM public.transactions
    WHERE user_id = _client_user_id
      AND type = 'meal'
      AND created_at > now() - interval '20 hours';

  IF v_recent_meal_count > 0 THEN
    RETURN jsonb_build_object('error', 'cooldown_active');
  END IF;

  -- 4. Weekly reset (monday-based week)
  v_monday := (date_trunc('week', now()))::date;

  IF v_profile.current_week_start IS NULL OR v_profile.current_week_start < v_monday THEN
    v_profile.consecutive_meals := 0;
    v_profile.current_week_start := v_monday;
  END IF;

  -- 5. Increment meals + points
  v_new_meals := v_profile.consecutive_meals + 1;

  -- 6. Discount at 4 meals
  IF v_new_meals >= 4 AND NOT v_profile.discount_available THEN
    v_reached_discount := true;
  END IF;

  v_description := 'Refeição ' || v_new_meals || '/4';

  -- 8. Insert transaction
  INSERT INTO public.transactions (user_id, amount, points_earned, type, description)
  VALUES (_client_user_id, 0, 10, 'meal', v_description)
  RETURNING id INTO v_tx_id;

  -- 7. Update profile
  UPDATE public.profiles
    SET consecutive_meals = v_new_meals,
        current_week_start = v_profile.current_week_start,
        total_points = total_points + 10,
        discount_available = CASE WHEN v_reached_discount THEN true ELSE discount_available END,
        discount_earned_at = CASE WHEN v_reached_discount THEN now() ELSE discount_earned_at END,
        updated_at = now()
    WHERE user_id = _client_user_id;

  -- 9. Admin action log
  INSERT INTO public.admin_actions (
    admin_id, client_user_id, client_name, client_code,
    action_type, description, points_changed, transaction_id
  )
  VALUES (
    _admin_id, _client_user_id, v_profile.display_name, v_profile.client_code,
    'register_meal', v_description, 10, v_tx_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'meals', v_new_meals,
    'reachedDiscount', v_reached_discount,
    'points', v_profile.total_points + 10
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_meal_atomic(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_meal_atomic(uuid, uuid) TO service_role;
