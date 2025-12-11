-- Add delivery type columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS delivery_type TEXT NOT NULL DEFAULT 'CREDENTIALS' CHECK (delivery_type IN ('CREDENTIALS', 'COUPON_CODE', 'MANUAL_ACTIVATION', 'INSTANT_KEY')),
ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,
ADD COLUMN IF NOT EXISTS requires_user_input BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS user_input_label TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add user_provided_input column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS user_provided_input TEXT;

-- Update credentials column to support flexible structure (JSONB already supports this)
-- The credentials column can now store:
-- For CREDENTIALS: { username, password, expiryDate, additionalInfo }
-- For COUPON_CODE: { couponCode, licenseKey, expiryDate, additionalInfo }
-- For MANUAL_ACTIVATION: { activationStatus, activationNotes, expiryDate, additionalInfo }
-- For INSTANT_KEY: { licenseKey, expiryDate, additionalInfo }

-- Create index for active products
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_delivery_type ON products(delivery_type);
