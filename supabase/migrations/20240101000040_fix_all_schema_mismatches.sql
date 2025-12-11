-- Fix all schema mismatches between code and database

-- =====================================================
-- NOTIFICATION_PREFERENCES TABLE
-- Code expects: email_order_updates, email_promotions, push_order_updates, push_promotions
-- DB has: order_updates, promotions, community
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_preferences' AND column_name = 'email_order_updates') THEN
        ALTER TABLE notification_preferences ADD COLUMN email_order_updates BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_preferences' AND column_name = 'email_promotions') THEN
        ALTER TABLE notification_preferences ADD COLUMN email_promotions BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_preferences' AND column_name = 'push_order_updates') THEN
        ALTER TABLE notification_preferences ADD COLUMN push_order_updates BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_preferences' AND column_name = 'push_promotions') THEN
        ALTER TABLE notification_preferences ADD COLUMN push_promotions BOOLEAN DEFAULT false;
    END IF;
END $$;

-- =====================================================
-- LOYALTY_POINTS TABLE
-- Code expects: total_points, lifetime_points, tier
-- DB has: points, lifetime_points (no tier)
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loyalty_points' AND column_name = 'total_points') THEN
        ALTER TABLE loyalty_points ADD COLUMN total_points INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loyalty_points' AND column_name = 'tier') THEN
        ALTER TABLE loyalty_points ADD COLUMN tier TEXT DEFAULT 'bronze';
    END IF;
END $$;

-- Copy points to total_points if total_points is null
UPDATE loyalty_points SET total_points = points WHERE total_points IS NULL AND points IS NOT NULL;

-- =====================================================
-- POINT_TRANSACTIONS TABLE
-- Code expects: order_id column
-- DB might not have it
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'point_transactions' AND column_name = 'order_id') THEN
        ALTER TABLE point_transactions ADD COLUMN order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =====================================================
-- COMMUNITY_POSTS TABLE
-- Code expects: image column
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'image') THEN
        ALTER TABLE community_posts ADD COLUMN image TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'comments') THEN
        ALTER TABLE community_posts ADD COLUMN comments INTEGER DEFAULT 0;
    END IF;
END $$;

-- =====================================================
-- REFERRALS TABLE
-- Code expects: reward_given column
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'reward_given') THEN
        ALTER TABLE referrals ADD COLUMN reward_given BOOLEAN DEFAULT false;
    END IF;
END $$;

-- =====================================================
-- COUPONS TABLE
-- Code expects: user_id, code, discount_amount, is_used, used_at, expires_at
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'user_id') THEN
        ALTER TABLE coupons ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'is_used') THEN
        ALTER TABLE coupons ADD COLUMN is_used BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'used_at') THEN
        ALTER TABLE coupons ADD COLUMN used_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'expires_at') THEN
        ALTER TABLE coupons ADD COLUMN expires_at TIMESTAMPTZ;
    END IF;
END $$;

-- =====================================================
-- FLASH_SALE_CONFIG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS flash_sale_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT false,
  discount_percent INTEGER DEFAULT 20,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default flash sale config if not exists
INSERT INTO flash_sale_config (is_active, discount_percent)
SELECT false, 20
WHERE NOT EXISTS (SELECT 1 FROM flash_sale_config LIMIT 1);

-- =====================================================
-- FIX RLS POLICIES FOR COUPONS
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
DROP POLICY IF EXISTS "Users can view own coupons" ON coupons;
DROP POLICY IF EXISTS "Users can create coupons" ON coupons;
DROP POLICY IF EXISTS "Users can update own coupons" ON coupons;
DROP POLICY IF EXISTS "coupons_select" ON coupons;
DROP POLICY IF EXISTS "coupons_insert" ON coupons;
DROP POLICY IF EXISTS "coupons_update" ON coupons;

CREATE POLICY "coupons_select" ON coupons FOR SELECT USING (
  auth.uid() = user_id OR 
  is_active = true OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "coupons_insert" ON coupons FOR INSERT WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "coupons_update" ON coupons FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "coupons_delete" ON coupons FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================================================
-- FIX RLS POLICIES FOR FLASH_SALE_CONFIG
-- =====================================================
ALTER TABLE flash_sale_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flash_sale_select" ON flash_sale_config;
DROP POLICY IF EXISTS "flash_sale_admin" ON flash_sale_config;

CREATE POLICY "flash_sale_select" ON flash_sale_config FOR SELECT USING (true);

CREATE POLICY "flash_sale_admin" ON flash_sale_config FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
