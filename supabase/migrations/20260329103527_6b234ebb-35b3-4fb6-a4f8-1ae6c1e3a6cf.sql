
CREATE TABLE public.problem_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone
);

ALTER TABLE public.problem_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reports
CREATE POLICY "Users can insert own reports"
  ON public.problem_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON public.problem_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all reports
CREATE POLICY "Admins can read all reports"
  ON public.problem_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update reports (e.g. mark as resolved)
CREATE POLICY "Admins can update reports"
  ON public.problem_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
