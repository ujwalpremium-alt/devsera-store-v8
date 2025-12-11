-- Fix RLS policies for community_posts likes (UPDATE)
DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
DROP POLICY IF EXISTS "Anyone can like posts" ON community_posts;

-- Allow users to update their own posts
CREATE POLICY "Users can update own posts" ON community_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow any authenticated user to update likes on any post
CREATE POLICY "Authenticated users can like posts" ON community_posts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Fix support_tickets INSERT policy again
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure users can view their own tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

-- Ensure admins can view all tickets
DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;
CREATE POLICY "Admins can view all tickets" ON support_tickets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
