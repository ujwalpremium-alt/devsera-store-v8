-- Add revoke columns to premium_memberships table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'premium_memberships' AND column_name = 'revoked_at') THEN
        ALTER TABLE premium_memberships ADD COLUMN revoked_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'premium_memberships' AND column_name = 'revoke_reason') THEN
        ALTER TABLE premium_memberships ADD COLUMN revoke_reason TEXT;
    END IF;
END $$;

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_premium_memberships_status ON premium_memberships(status);
CREATE INDEX IF NOT EXISTS idx_premium_memberships_user_id ON premium_memberships(user_id);
