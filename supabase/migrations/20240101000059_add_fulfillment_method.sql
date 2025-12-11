-- Add fulfillment_method column to products table for how the product is delivered to customer
-- This is separate from delivery_type which defines what type of content is delivered

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'fulfillment_method') THEN
        ALTER TABLE products ADD COLUMN fulfillment_method TEXT DEFAULT 'EMAIL';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'fulfillment_details') THEN
        ALTER TABLE products ADD COLUMN fulfillment_details TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'custom_requirements_label') THEN
        ALTER TABLE products ADD COLUMN custom_requirements_label TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'custom_user_sees_label') THEN
        ALTER TABLE products ADD COLUMN custom_user_sees_label TEXT;
    END IF;
END $$;

-- Fulfillment methods are stored in the app code, not in database
