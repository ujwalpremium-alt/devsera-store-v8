-- Create community_likes table to track user likes (one like per user per post)
CREATE TABLE IF NOT EXISTS community_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create community_comments table
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_community_likes_post_id ON community_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_user_id ON community_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON community_comments(user_id);

-- Enable RLS
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_likes
DROP POLICY IF EXISTS "likes_select" ON community_likes;
CREATE POLICY "likes_select" ON community_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "likes_insert" ON community_likes;
CREATE POLICY "likes_insert" ON community_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "likes_delete" ON community_likes;
CREATE POLICY "likes_delete" ON community_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for community_comments
DROP POLICY IF EXISTS "comments_select" ON community_comments;
CREATE POLICY "comments_select" ON community_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "comments_insert" ON community_comments;
CREATE POLICY "comments_insert" ON community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_update" ON community_comments;
CREATE POLICY "comments_update" ON community_comments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_delete" ON community_comments;
CREATE POLICY "comments_delete" ON community_comments FOR DELETE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Function to update likes count on community_posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts SET likes = (SELECT COUNT(*) FROM community_likes WHERE post_id = NEW.post_id) WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts SET likes = (SELECT COUNT(*) FROM community_likes WHERE post_id = OLD.post_id) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comments count on community_posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts SET comments = (SELECT COUNT(*) FROM community_comments WHERE post_id = NEW.post_id) WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts SET comments = (SELECT COUNT(*) FROM community_comments WHERE post_id = OLD.post_id) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_post_likes ON community_likes;
CREATE TRIGGER trigger_update_post_likes
    AFTER INSERT OR DELETE ON community_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

DROP TRIGGER IF EXISTS trigger_update_post_comments ON community_comments;
CREATE TRIGGER trigger_update_post_comments
    AFTER INSERT OR DELETE ON community_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();
