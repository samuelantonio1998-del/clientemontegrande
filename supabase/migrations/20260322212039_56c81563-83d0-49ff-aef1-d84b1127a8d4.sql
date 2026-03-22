
DROP POLICY "Authenticated users can insert ad clicks" ON public.ad_clicks;
CREATE POLICY "Authenticated users can insert ad clicks"
  ON public.ad_clicks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
