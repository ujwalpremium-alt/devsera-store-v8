-- Add Product Variants and Stock Management

-- Create product_variants table for multiple duration/price options
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    duration TEXT NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2) NOT NULL,
    stock_count INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product_stock_keys table for pre-loaded keys/credentials
CREATE TABLE IF NOT EXISTS product_stock_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    key_type TEXT NOT NULL DEFAULT 'LICENSE_KEY',
    key_value TEXT NOT NULL,
    username TEXT,
    password TEXT,
    additional_data JSONB,
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    assigned_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    expiry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add scheduling columns to products
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'scheduled_start') THEN
        ALTER TABLE products ADD COLUMN scheduled_start TIMESTAMPTZ;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'scheduled_end') THEN
        ALTER TABLE products ADD COLUMN scheduled_end TIMESTAMPTZ;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'has_variants') THEN
        ALTER TABLE products ADD COLUMN has_variants BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'low_stock_alert') THEN
        ALTER TABLE products ADD COLUMN low_stock_alert INTEGER DEFAULT 5;
    END IF;
END $$;

-- Add variant_id to orders table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'variant_id') THEN
        ALTER TABLE orders ADD COLUMN variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_stock_keys_product_id ON product_stock_keys(product_id);
CREATE INDEX IF NOT EXISTS idx_product_stock_keys_status ON product_stock_keys(status);
CREATE INDEX IF NOT EXISTS idx_product_stock_keys_variant_id ON product_stock_keys(variant_id);
CREATE INDEX IF NOT EXISTS idx_products_scheduled ON products(scheduled_start, scheduled_end);

-- RLS Policies for product_variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view product variants" ON product_variants;
CREATE POLICY "Anyone can view product variants" ON product_variants
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage product variants" ON product_variants;
CREATE POLICY "Admins can manage product variants" ON product_variants
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- RLS Policies for product_stock_keys
ALTER TABLE product_stock_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage stock keys" ON product_stock_keys;
CREATE POLICY "Admins can manage stock keys" ON product_stock_keys
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- Function to get available stock count for a product
CREATE OR REPLACE FUNCTION get_product_stock_count(p_product_id UUID, p_variant_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
    IF p_variant_id IS NOT NULL THEN
        RETURN (SELECT COUNT(*) FROM product_stock_keys 
                WHERE product_id = p_product_id 
                AND variant_id = p_variant_id 
                AND status = 'AVAILABLE');
    ELSE
        RETURN (SELECT COUNT(*) FROM product_stock_keys 
                WHERE product_id = p_product_id 
                AND status = 'AVAILABLE');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to assign a stock key to an order
CREATE OR REPLACE FUNCTION assign_stock_key_to_order(p_order_id UUID, p_product_id UUID, p_variant_id UUID DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    v_key_id UUID;
BEGIN
    IF p_variant_id IS NOT NULL THEN
        SELECT id INTO v_key_id FROM product_stock_keys 
        WHERE product_id = p_product_id 
        AND variant_id = p_variant_id 
        AND status = 'AVAILABLE'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED;
    ELSE
        SELECT id INTO v_key_id FROM product_stock_keys 
        WHERE product_id = p_product_id 
        AND status = 'AVAILABLE'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED;
    END IF;
    
    IF v_key_id IS NOT NULL THEN
        UPDATE product_stock_keys 
        SET status = 'ASSIGNED', 
            assigned_order_id = p_order_id,
            updated_at = NOW()
        WHERE id = v_key_id;
    END IF;
    
    RETURN v_key_id;
END;
$$ LANGUAGE plpgsql;
