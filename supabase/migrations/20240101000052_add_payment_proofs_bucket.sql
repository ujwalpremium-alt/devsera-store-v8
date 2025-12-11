INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can upload payment proofs" ON storage.objects;
CREATE POLICY "Anyone can upload payment proofs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can view payment proofs" ON storage.objects;
CREATE POLICY "Anyone can view payment proofs" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS "Admins can delete payment proofs" ON storage.objects;
CREATE POLICY "Admins can delete payment proofs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'payment-proofs' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
