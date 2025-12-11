-- Fix products table schema - add all missing columns
-- This migration ensures all required columns exist

-- Add delivery_type column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'delivery_type') THEN
        ALTER TABLE products ADD COLUMN delivery_type TEXT NOT NULL DEFAULT 'CREDENTIALS';
    END IF;
END $$;

-- Add delivery_instructions column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'delivery_instructions') THEN
        ALTER TABLE products ADD COLUMN delivery_instructions TEXT;
    END IF;
END $$;

-- Add requires_user_input column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'requires_user_input') THEN
        ALTER TABLE products ADD COLUMN requires_user_input BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add user_input_label column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'user_input_label') THEN
        ALTER TABLE products ADD COLUMN user_input_label TEXT;
    END IF;
END $$;

-- Add is_active column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_active') THEN
        ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_delivery_type ON products(delivery_type);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Update RLS policies for products
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
