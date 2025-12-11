-- Fix RLS policies for community_posts and reviews

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;

-- Create new policies that properly check user authentication
CREATE POLICY "Authenticated users can create posts" ON community_posts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );

CREATE POLICY "Authenticated users can create reviews" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );

-- Add admin policies for community posts management
DROP POLICY IF EXISTS "Admins can delete any post" ON community_posts;
CREATE POLICY "Admins can delete any post" ON community_posts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update any post" ON community_posts;
CREATE POLICY "Admins can update any post" ON community_posts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Add admin policies for reviews management
DROP POLICY IF EXISTS "Admins can delete any review" ON reviews;
CREATE POLICY "Admins can delete any review" ON reviews
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update any review" ON reviews;
CREATE POLICY "Admins can update any review" ON reviews
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Add telegram_username to settings if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'telegram_username') THEN
    ALTER TABLE settings ADD COLUMN telegram_username TEXT DEFAULT '@karthik_nkn';
  END IF;
END $$;
