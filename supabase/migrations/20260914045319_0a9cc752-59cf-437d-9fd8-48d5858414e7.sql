CREATE POLICY "card_proofs_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'card-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "card_proofs_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'card-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

CREATE POLICY "chat_images_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-images' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));
CREATE POLICY "chat_images_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-images' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));