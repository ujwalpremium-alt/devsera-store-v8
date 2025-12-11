-- Fix orders table - add missing columns
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS total_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_provided_input TEXT;

-- Make total_amount nullable or set default
ALTER TABLE orders ALTER COLUMN total_amount SET DEFAULT 0;

-- Update any existing orders with null total_amount
UPDATE orders SET total_amount = 0 WHERE total_amount IS NULL;

-- Create index for order status
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
