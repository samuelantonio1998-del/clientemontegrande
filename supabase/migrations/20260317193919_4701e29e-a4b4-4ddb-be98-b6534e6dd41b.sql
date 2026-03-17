
-- Storage bucket for follow screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('follow-screenshots', 'follow-screenshots', false);

-- Allow authenticated users to upload their own screenshots
CREATE POLICY "Users can upload follow screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'follow-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to read their own screenshots
CREATE POLICY "Users can read own follow screenshots"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'follow-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow admins to read all follow screenshots
CREATE POLICY "Admins can read all follow screenshots"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'follow-screenshots' AND public.has_role(auth.uid(), 'admin'));

-- Table for follow claims
CREATE TABLE public.follow_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL DEFAULT 'instagram',
  screenshot_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  points_awarded NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  UNIQUE(user_id, platform)
);

ALTER TABLE public.follow_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own follow claims"
ON public.follow_claims FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own follow claims"
ON public.follow_claims FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all follow claims"
ON public.follow_claims FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update follow claims"
ON public.follow_claims FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
