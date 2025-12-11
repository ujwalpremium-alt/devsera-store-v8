ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS features text[] DEFAULT NULL;
