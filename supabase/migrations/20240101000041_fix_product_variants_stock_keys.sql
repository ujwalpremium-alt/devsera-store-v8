-- Fix product_variants and product_stock_keys schema mismatches

-- =====================================================
-- PRODUCT_VARIANTS TABLE
-- Code expects: is_default, sort_order columns
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'is_default') THEN
        ALTER TABLE product_variants ADD COLUMN is_default BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'sort_order') THEN
        ALTER TABLE product_variants ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- =====================================================
-- PRODUCT_STOCK_KEYS TABLE
-- Code expects: key_type, key_value, status, assigned_order_id, expiry_date
-- DB has: key_data, is_used, used_by, used_at
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_stock_keys' AND column_name = 'key_type') THEN
        ALTER TABLE product_stock_keys ADD COLUMN key_type TEXT DEFAULT 'LICENSE_KEY';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_stock_keys' AND column_name = 'key_value') THEN
        ALTER TABLE product_stock_keys ADD COLUMN key_value TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_stock_keys' AND column_name = 'status') THEN
        ALTER TABLE product_stock_keys ADD COLUMN status TEXT DEFAULT 'AVAILABLE';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_stock_keys' AND column_name = 'assigned_order_id') THEN
        ALTER TABLE product_stock_keys ADD COLUMN assigned_order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_stock_keys' AND column_name = 'expiry_date') THEN
        ALTER TABLE product_stock_keys ADD COLUMN expiry_date TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_stock_keys' AND column_name = 'additional_data') THEN
        ALTER TABLE product_stock_keys ADD COLUMN additional_data JSONB;
    END IF;
END $$;

-- Copy key_data to key_value if key_value is null
UPDATE product_stock_keys SET key_value = key_data WHERE key_value IS NULL AND key_data IS NOT NULL;

-- Update status based on is_used
UPDATE product_stock_keys SET status = 'USED' WHERE is_used = true AND status = 'AVAILABLE';

-- Drop the constraint that requires either product_id or variant_id (allow both to be set)
ALTER TABLE product_stock_keys DROP CONSTRAINT IF EXISTS product_or_variant_required;

-- Ensure product_id can be set
ALTER TABLE product_stock_keys ALTER COLUMN product_id DROP NOT NULL;
