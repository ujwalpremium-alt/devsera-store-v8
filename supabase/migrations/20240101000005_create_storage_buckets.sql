-- Create storage buckets for the application

-- Create bucket for order files (payment screenshots)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('order-files', 'order-files', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for settings files (QR codes, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('settings-files', 'settings-files', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('product-images', 'product-images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to order-files bucket
DROP POLICY IF EXISTS "Public read access for order-files" ON storage.objects;
CREATE POLICY "Public read access for order-files" ON storage.objects
  FOR SELECT USING (bucket_id = 'order-files');

-- Allow authenticated users to upload to order-files bucket
DROP POLICY IF EXISTS "Authenticated users can upload to order-files" ON storage.objects;
CREATE POLICY "Authenticated users can upload to order-files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'order-files' AND auth.role() = 'authenticated');

-- Allow public read access to settings-files bucket
DROP POLICY IF EXISTS "Public read access for settings-files" ON storage.objects;
CREATE POLICY "Public read access for settings-files" ON storage.objects
  FOR SELECT USING (bucket_id = 'settings-files');

-- Allow authenticated users to upload to settings-files bucket
DROP POLICY IF EXISTS "Authenticated users can upload to settings-files" ON storage.objects;
CREATE POLICY "Authenticated users can upload to settings-files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'settings-files' AND auth.role() = 'authenticated');

-- Allow public read access to product-images bucket
DROP POLICY IF EXISTS "Public read access for product-images" ON storage.objects;
CREATE POLICY "Public read access for product-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Allow authenticated users to upload to product-images bucket
DROP POLICY IF EXISTS "Authenticated users can upload to product-images" ON storage.objects;
CREATE POLICY "Authenticated users can upload to product-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete from product-images bucket
DROP POLICY IF EXISTS "Authenticated users can delete from product-images" ON storage.objects;
CREATE POLICY "Authenticated users can delete from product-images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
