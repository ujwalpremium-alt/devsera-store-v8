-- Add requires_password column to products table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'requires_password') THEN
        ALTER TABLE products ADD COLUMN requires_password BOOLEAN DEFAULT TRUE;
    END IF;
END $$;
