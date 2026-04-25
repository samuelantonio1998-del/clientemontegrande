DO $$
DECLARE
  v_user_id uuid := '0884ef99-2414-45ea-a030-f1a1df7f82cb';
BEGIN
  INSERT INTO public.transactions (user_id, amount, points_earned, type, description)
  VALUES (v_user_id, 0, 200, 'admin_adjustment', 'Ajuste manual: +200 pontos');

  UPDATE public.profiles
    SET total_points = total_points + 200
    WHERE user_id = v_user_id;
END $$;