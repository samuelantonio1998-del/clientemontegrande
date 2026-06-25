
-- Disable point expiration system
-- 1. Unschedule the cron job
DO $$
BEGIN
  PERFORM cron.unschedule('expire-points-daily');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 2. Drop the trigger that sets expires_at on new transactions
DROP TRIGGER IF EXISTS set_transaction_expiry_trigger ON public.transactions;
DROP TRIGGER IF EXISTS trg_set_transaction_expiry ON public.transactions;
DROP TRIGGER IF EXISTS set_expires_at ON public.transactions;

-- 3. Clear expires_at on all existing transactions and mark none as expired
UPDATE public.transactions
  SET expires_at = NULL
  WHERE expires_at IS NOT NULL;

-- 4. Convert expire_points into a no-op (kept for backward compatibility)
CREATE OR REPLACE FUNCTION public.expire_points()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$ SELECT 1; $$;

-- 5. Convert set_transaction_expiry into a no-op pass-through (in case still referenced)
CREATE OR REPLACE FUNCTION public.set_transaction_expiry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.expires_at := NULL;
  RETURN NEW;
END;
$$;
