
-- Rate limits table for tracking request frequency
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,        -- IP address or email
  action text NOT NULL,             -- 'login', 'signup', 'reset', 'scan', etc.
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1,
  UNIQUE (identifier, action)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "Service role can manage rate limits"
  ON public.rate_limits FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to check and increment rate limit
-- Returns true if the request is ALLOWED, false if BLOCKED
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_action text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_record rate_limits%ROWTYPE;
  v_window_start timestamp with time zone;
BEGIN
  v_window_start := now() - (p_window_seconds || ' seconds')::interval;

  -- Try to get existing record
  SELECT * INTO v_record
    FROM public.rate_limits
    WHERE identifier = p_identifier AND action = p_action;

  IF NOT FOUND THEN
    -- First request, create record
    INSERT INTO public.rate_limits (identifier, action, window_start, request_count)
    VALUES (p_identifier, p_action, now(), 1)
    ON CONFLICT (identifier, action) DO NOTHING;
    RETURN true;
  END IF;

  -- If window has expired, reset
  IF v_record.window_start < v_window_start THEN
    UPDATE public.rate_limits
    SET window_start = now(), request_count = 1
    WHERE id = v_record.id;
    RETURN true;
  END IF;

  -- Check if limit exceeded
  IF v_record.request_count >= p_max_requests THEN
    RETURN false;
  END IF;

  -- Increment counter
  UPDATE public.rate_limits
  SET request_count = request_count + 1
  WHERE id = v_record.id;

  RETURN true;
END;
$$;

-- Cleanup old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '1 hour';
$$;

-- Add cron job to clean up old records every 10 minutes
SELECT cron.schedule(
  'cleanup-rate-limits',
  '*/10 * * * *',
  'SELECT public.cleanup_rate_limits()'
);
