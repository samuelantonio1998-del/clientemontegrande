CREATE OR REPLACE FUNCTION public._tmp_add_points_862782()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
    SET total_points = total_points + 200
    WHERE user_id = '0884ef99-2414-45ea-a030-f1a1df7f82cb';
END;
$$;

SELECT public._tmp_add_points_862782();

DROP FUNCTION public._tmp_add_points_862782();