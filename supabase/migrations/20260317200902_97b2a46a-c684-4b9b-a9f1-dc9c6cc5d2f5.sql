CREATE POLICY "Users can update own follow claims"
ON public.follow_claims FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);