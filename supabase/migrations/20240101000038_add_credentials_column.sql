-- Add missing credentials column to orders table

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'credentials') THEN
        ALTER TABLE orders ADD COLUMN credentials JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'cancellation_reason') THEN
        ALTER TABLE orders ADD COLUMN cancellation_reason TEXT;
    END IF;
END $$;
