-- Fix storage policies for order-files bucket

-- Drop existing policies
DROP POLICY IF EXISTS "Public read access for order-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to order-files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload order files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own order files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own order files" ON storage.objects;

-- Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('order-files', 'order-files', true, 10485760)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anyone to read from order-files bucket
CREATE POLICY "Anyone can read order files" ON storage.objects
  FOR SELECT USING (bucket_id = 'order-files');

-- Allow authenticated users to upload to order-files bucket
CREATE POLICY "Authenticated users can upload order files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'order-files' 
    AND auth.uid() IS NOT NULL
  );

-- Allow users to update their own uploaded files
CREATE POLICY "Users can update order files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'order-files' 
    AND auth.uid() IS NOT NULL
  );

-- Allow users to delete their own uploaded files
CREATE POLICY "Users can delete order files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'order-files' 
    AND auth.uid() IS NOT NULL
  );

-- Also fix product-images bucket policies
DROP POLICY IF EXISTS "Public read access for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('product-images', 'product-images', true, 5242880)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Anyone can read product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can update product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can delete product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' 
    AND auth.uid() IS NOT NULL
  );
