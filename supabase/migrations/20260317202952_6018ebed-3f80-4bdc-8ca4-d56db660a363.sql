
-- Admin actions log table (auto-cleanup after 48h)
CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  client_user_id uuid NOT NULL,
  client_name text,
  client_code text,
  action_type text NOT NULL, -- 'meal', 'redeem_discount', 'redeem_buffet'
  description text NOT NULL,
  points_changed numeric NOT NULL DEFAULT 0,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  undone boolean NOT NULL DEFAULT false
);

-- RLS
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read admin actions"
  ON public.admin_actions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert admin actions"
  ON public.admin_actions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update admin actions"
  ON public.admin_actions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete admin actions"
  ON public.admin_actions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Cron job to clean up actions older than 48h (runs every hour)
SELECT cron.schedule(
  'cleanup-admin-actions',
  '0 * * * *',
  $$DELETE FROM public.admin_actions WHERE created_at < now() - interval '48 hours'$$
);
