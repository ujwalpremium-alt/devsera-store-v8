-- Add delivery_type column to product_variants table
-- This allows each variant to have its own delivery type (e.g., COUPON_CODE, CREDENTIALS, etc.)

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'delivery_type') THEN
        ALTER TABLE product_variants ADD COLUMN delivery_type TEXT DEFAULT 'CREDENTIALS';
    END IF;
END $$;
