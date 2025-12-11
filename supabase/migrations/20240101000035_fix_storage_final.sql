-- Final fix for storage policies - ensure all buckets work properly

-- Drop ALL existing storage policies to start fresh
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Ensure buckets exist with correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('order-files', 'order-files', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET 
  public = true, 
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET 
  public = true, 
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('settings-files', 'settings-files', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET 
  public = true, 
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Create simple, permissive policies for all buckets

-- ORDER-FILES: Anyone can read, authenticated users can upload/update/delete
CREATE POLICY "order_files_read" ON storage.objects FOR SELECT 
  USING (bucket_id = 'order-files');

CREATE POLICY "order_files_insert" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'order-files' AND auth.role() = 'authenticated');

CREATE POLICY "order_files_update" ON storage.objects FOR UPDATE 
  USING (bucket_id = 'order-files' AND auth.role() = 'authenticated');

CREATE POLICY "order_files_delete" ON storage.objects FOR DELETE 
  USING (bucket_id = 'order-files' AND auth.role() = 'authenticated');

-- PRODUCT-IMAGES: Anyone can read, authenticated users can upload/update/delete
CREATE POLICY "product_images_read" ON storage.objects FOR SELECT 
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_insert" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "product_images_update" ON storage.objects FOR UPDATE 
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "product_images_delete" ON storage.objects FOR DELETE 
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- SETTINGS-FILES: Anyone can read, authenticated users can upload/update/delete
CREATE POLICY "settings_files_read" ON storage.objects FOR SELECT 
  USING (bucket_id = 'settings-files');

CREATE POLICY "settings_files_insert" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'settings-files' AND auth.role() = 'authenticated');

CREATE POLICY "settings_files_update" ON storage.objects FOR UPDATE 
  USING (bucket_id = 'settings-files' AND auth.role() = 'authenticated');

CREATE POLICY "settings_files_delete" ON storage.objects FOR DELETE 
  USING (bucket_id = 'settings-files' AND auth.role() = 'authenticated');
