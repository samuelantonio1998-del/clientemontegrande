-- =====================================================================
-- Atomic register_meal function — fixes race condition where two near-
-- simultaneous calls (double-click, double scan, two admin tabs) could
-- bypass the 5-hour server-side cooldown.
--
-- Strategy:
--   1. SELECT ... FOR UPDATE on the client profile row → exclusive lock
--      until transaction commits. Concurrent calls serialize naturally.
--   2. Cooldown check + insert + profile update all inside the same
--      transaction. Either all succeed, or none do.
--
-- Returns JSON for easy consumption by the Edge Function caller.
-- =====================================================================

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
  _profile        public.profiles%ROWTYPE;
  _five_hours_ago timestamptz := now() - interval '5 hours';
  _recent_meal_id uuid;
  _monday         date;
  _new_meals      integer;
  _reached        boolean;
  _description    text;
  _new_total      numeric;
  _tx_id          uuid;
  _is_admin       boolean;
BEGIN
  -- Authorization: the caller must be an admin.
  SELECT public.has_role(_admin_id, 'admin'::app_role) INTO _is_admin;
  IF NOT _is_admin THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  -- Lock the client profile row exclusively for the duration of this
  -- transaction. Any concurrent call to this function for the same
  -- client will block here until we commit.
  SELECT * INTO _profile
  FROM public.profiles
  WHERE user_id = _client_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'client_not_found');
  END IF;

  -- Cooldown check: is there a meal transaction in the last 5h?
  SELECT id INTO _recent_meal_id
  FROM public.transactions
  WHERE user_id = _client_user_id
    AND type = 'meal'
    AND created_at >= _five_hours_ago
  LIMIT 1;

  IF _recent_meal_id IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'cooldown_active');
  END IF;

  -- Compute current week's Monday (PostgreSQL: 1 = Mon ... 7 = Sun).
  _monday := (current_date - ((EXTRACT(ISODOW FROM current_date)::int - 1)));

  -- Reset weekly counter if we crossed week boundaries.
  IF _profile.current_week_start IS DISTINCT FROM _monday THEN
    _new_meals := 1;
  ELSE
    _new_meals := COALESCE(_profile.consecutive_meals, 0) + 1;
  END IF;

  _reached := _new_meals >= 4;

  IF _reached THEN
    _description := 'Refeição ' || _new_meals || '/4 — desconto desbloqueado!';
  ELSE
    _description := 'Refeição ' || _new_meals || '/4';
  END IF;

  -- Insert the transaction.
  INSERT INTO public.transactions (user_id, amount, points_earned, description, type)
  VALUES (_client_user_id, 0, 10, _description, 'meal')
  RETURNING id INTO _tx_id;

  -- Update the profile.
  _new_total := COALESCE(_profile.total_points, 0) + 10;

  UPDATE public.profiles
  SET
    consecutive_meals    = CASE WHEN _reached THEN 0 ELSE _new_meals END,
    current_week_start   = _monday,
    discount_available   = CASE WHEN _reached THEN true ELSE discount_available END,
    discount_earned_at   = CASE WHEN _reached THEN now()  ELSE discount_earned_at END,
    total_points         = _new_total,
    -- Cross the 200-point buffet threshold this turn?
    buffet_earned_at     = CASE
      WHEN _new_total >= 200 AND COALESCE(_profile.total_points, 0) < 200
        THEN now()
      ELSE buffet_earned_at
    END
  WHERE user_id = _client_user_id;

  -- Log admin action (best-effort: if the table doesn't exist we don't care).
  BEGIN
    INSERT INTO public.admin_actions (
      admin_id, client_user_id, client_name, client_code,
      action_type, description, points_changed, transaction_id
    )
    VALUES (
      _admin_id, _client_user_id, _profile.display_name, _profile.client_code,
      'meal', _description, 10, _tx_id
    );
  EXCEPTION WHEN OTHERS THEN
    -- Don't fail the whole meal registration if admin log fails.
    NULL;
  END;

  RETURN jsonb_build_object(
    'success',         true,
    'meals',           _new_meals,
    'reachedDiscount', _reached,
    'pointsEarned',    10,
    'transactionId',   _tx_id
  );
END;
$$;

-- Lock down direct invocation — only Edge Functions with the service-role
-- key should call this. The function itself does an internal admin check.
REVOKE EXECUTE ON FUNCTION public.register_meal_atomic(uuid, uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.register_meal_atomic(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.register_meal_atomic(uuid, uuid) FROM authenticated;
-- Edge functions running with service_role bypass these grants.

COMMENT ON FUNCTION public.register_meal_atomic IS
  'Atomically registers a meal: locks the client profile, enforces 5h cooldown, inserts transaction, updates points & weekly counter. Called only from the register-meal Edge Function.';
