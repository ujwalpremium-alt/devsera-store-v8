-- Fix orders table status constraint and ensure proper schema

-- First, drop the existing constraint if it exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Update any existing status values to uppercase
UPDATE orders SET status = UPPER(status) WHERE status IS NOT NULL;

-- Add the correct constraint with uppercase values
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('PENDING', 'SUBMITTED', 'COMPLETED', 'CANCELLED', 'PROCESSING'));

-- Ensure all required columns exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_amount') THEN
        ALTER TABLE orders ADD COLUMN total_amount INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_provided_input') THEN
        ALTER TABLE orders ADD COLUMN user_provided_input TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'variant_id') THEN
        ALTER TABLE orders ADD COLUMN variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'transaction_id') THEN
        ALTER TABLE orders ADD COLUMN transaction_id TEXT;
    END IF;
END $$;

-- Ensure products table has is_active column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_active') THEN
        ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Ensure product_variants table exists and has proper structure
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration TEXT,
  original_price INTEGER NOT NULL DEFAULT 0,
  sale_price INTEGER NOT NULL DEFAULT 0,
  stock_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh RLS policies for orders
DROP POLICY IF EXISTS "orders_select" ON orders;
DROP POLICY IF EXISTS "orders_insert" ON orders;
DROP POLICY IF EXISTS "orders_update" ON orders;
DROP POLICY IF EXISTS "orders_delete" ON orders;

CREATE POLICY "orders_select" ON orders FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update" ON orders FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "orders_delete" ON orders FOR DELETE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
