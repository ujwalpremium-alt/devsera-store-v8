-- Fix bundles table schema - add missing columns

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bundles' AND column_name = 'image_url') THEN
        ALTER TABLE bundles ADD COLUMN image_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bundles' AND column_name = 'original_price') THEN
        ALTER TABLE bundles ADD COLUMN original_price DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bundles' AND column_name = 'sale_price') THEN
        ALTER TABLE bundles ADD COLUMN sale_price DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bundles' AND column_name = 'valid_until') THEN
        ALTER TABLE bundles ADD COLUMN valid_until TIMESTAMPTZ;
    END IF;
END $$;

-- Copy image to image_url if image_url is null
UPDATE bundles SET image_url = image WHERE image_url IS NULL AND image IS NOT NULL;
