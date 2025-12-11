-- Add missing columns to product_variants table
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
