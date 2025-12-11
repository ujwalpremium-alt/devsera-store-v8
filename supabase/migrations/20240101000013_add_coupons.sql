-- Coupons table for loyalty point redemption
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 100,
  points_used INTEGER NOT NULL DEFAULT 5000,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_user ON coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own coupons" ON coupons;
CREATE POLICY "Users can view own coupons" ON coupons
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create coupons" ON coupons;
CREATE POLICY "Users can create coupons" ON coupons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own coupons" ON coupons;
CREATE POLICY "Users can update own coupons" ON coupons
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all coupons" ON coupons;
CREATE POLICY "Admins can view all coupons" ON coupons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Add phone column to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
  END IF;
END $$;
