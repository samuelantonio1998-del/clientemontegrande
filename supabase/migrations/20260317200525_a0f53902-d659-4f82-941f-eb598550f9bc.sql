-- Add UPDATE and DELETE policies for follow-screenshots storage
CREATE POLICY "Users can update own follow screenshots"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'follow-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Service role can delete follow screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'follow-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);