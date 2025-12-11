-- Fix remaining schema issues

-- =====================================================
-- REVIEWS TABLE
-- Code expects: verified column
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'verified') THEN
        ALTER TABLE reviews ADD COLUMN verified BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'updated_at') THEN
        ALTER TABLE reviews ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- COMMUNITY_POSTS TABLE
-- Code expects: updated_at column
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'updated_at') THEN
        ALTER TABLE community_posts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- ACCOUNTS TABLE
-- Code expects: product_id column (for legacy support)
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'product_id') THEN
        ALTER TABLE accounts ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'max_slots') THEN
        ALTER TABLE accounts ADD COLUMN max_slots INTEGER DEFAULT 5;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'used_slots') THEN
        ALTER TABLE accounts ADD COLUMN used_slots INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'status') THEN
        ALTER TABLE accounts ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'expiry_date') THEN
        ALTER TABLE accounts ADD COLUMN expiry_date DATE;
    END IF;
END $$;

-- =====================================================
-- SETTINGS TABLE
-- Ensure telegram_username column exists
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'telegram_username') THEN
        ALTER TABLE settings ADD COLUMN telegram_username TEXT DEFAULT '@support';
    END IF;
END $$;

-- =====================================================
-- PROFILES TABLE
-- Ensure name column exists (some code uses name, some uses full_name)
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'name') THEN
        ALTER TABLE profiles ADD COLUMN name TEXT;
    END IF;
END $$;

-- Copy full_name to name if name is null
UPDATE profiles SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;

-- =====================================================
-- ENSURE ALL TRIGGERS EXIST
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_reviews_updated_at') THEN
        CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_community_posts_updated_at') THEN
        CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
