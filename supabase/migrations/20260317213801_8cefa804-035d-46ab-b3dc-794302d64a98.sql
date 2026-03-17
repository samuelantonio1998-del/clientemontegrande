
-- Ads/banners table
CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  link_url text,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Everyone can read active ads (public feature)
CREATE POLICY "Anyone can read active ads"
  ON public.ads FOR SELECT
  TO authenticated
  USING (active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage ads"
  ON public.ads FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for ad images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload to ads bucket
CREATE POLICY "Admins can upload ad images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ad images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ad images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));

-- Public read for ad images
CREATE POLICY "Anyone can view ad images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'ads');
