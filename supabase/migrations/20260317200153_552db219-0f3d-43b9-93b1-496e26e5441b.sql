-- Schedule daily points expiry check at 3 AM
SELECT cron.schedule(
  'expire-points-daily',
  '0 3 * * *',
  $$SELECT public.expire_points()$$
);