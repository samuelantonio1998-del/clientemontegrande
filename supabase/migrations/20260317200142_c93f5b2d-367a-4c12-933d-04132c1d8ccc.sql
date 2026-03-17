-- Add expiry tracking to transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS expired boolean NOT NULL DEFAULT false;

-- Set expires_at for all existing transactions (2 months from creation)
UPDATE public.transactions
  SET expires_at = created_at + interval '2 months'
  WHERE expires_at IS NULL AND points_earned > 0;

-- Set default for new rows: expires_at = created_at + 2 months
CREATE OR REPLACE FUNCTION public.set_transaction_expiry()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.points_earned > 0 AND NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.created_at + interval '2 months';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_transaction_expiry
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_transaction_expiry();

-- Function to expire points (called by cron)
CREATE OR REPLACE FUNCTION public.expire_points()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id, user_id, points_earned
    FROM public.transactions
    WHERE expired = false
      AND expires_at IS NOT NULL
      AND expires_at <= now()
      AND points_earned > 0
  LOOP
    -- Mark as expired
    UPDATE public.transactions SET expired = true WHERE id = rec.id;

    -- Deduct points from profile (never go below 0)
    UPDATE public.profiles
      SET total_points = GREATEST(total_points - rec.points_earned, 0)
      WHERE user_id = rec.user_id;

    -- Log expiry transaction
    INSERT INTO public.transactions (user_id, amount, points_earned, type, description, expires_at)
    VALUES (rec.user_id, 0, -rec.points_earned, 'expiry', 'Pontos expirados', NULL);
  END LOOP;
END;
$$;