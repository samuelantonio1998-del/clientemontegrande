CREATE TABLE public.ad_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  clicked_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert ad clicks" ON public.ad_clicks FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can read ad clicks" ON public.ad_clicks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));