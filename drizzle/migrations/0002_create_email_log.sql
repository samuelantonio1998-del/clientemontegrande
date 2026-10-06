CREATE TABLE public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  template text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  resend_id text,
  status text DEFAULT 'sent'
);
GRANT SELECT ON public.email_log TO authenticated;
GRANT ALL ON public.email_log TO service_role;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read email log" ON public.email_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));