DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'cost_price') THEN
        ALTER TABLE product_variants ADD COLUMN cost_price DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;
