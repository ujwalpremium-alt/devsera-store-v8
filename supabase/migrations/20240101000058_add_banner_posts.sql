-- Create banner_posts table for customizable ad posts on the front page
CREATE TABLE IF NOT EXISTS banner_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    button_text VARCHAR(100) DEFAULT 'Shop Now',
    button_link VARCHAR(500) DEFAULT '/',
    gradient VARCHAR(255) DEFAULT 'from-teal-600 via-teal-700 to-emerald-800',
    icon_type VARCHAR(50) DEFAULT 'sparkles',
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active banners
CREATE INDEX IF NOT EXISTS idx_banner_posts_active ON banner_posts(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_banner_posts_dates ON banner_posts(start_date, end_date);

-- Enable RLS
ALTER TABLE banner_posts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active banners
DROP POLICY IF EXISTS "Anyone can view active banners" ON banner_posts;
CREATE POLICY "Anyone can view active banners" ON banner_posts
    FOR SELECT USING (is_active = true);

-- Allow admins to manage banners
DROP POLICY IF EXISTS "Admins can manage banners" ON banner_posts;
CREATE POLICY "Admins can manage banners" ON banner_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Insert default banner posts
INSERT INTO banner_posts (title, subtitle, description, button_text, button_link, gradient, icon_type, display_order, is_active)
VALUES 
    ('Premium Services', 'Unbeatable Prices', 'Get instant access to Canva Pro, LinkedIn Premium, Netflix, and more at up to 85% off!', 'Shop Now', '/', 'from-teal-600 via-teal-700 to-emerald-800', 'sparkles', 1, true),
    ('Bundle & Save', 'Up to 50% Extra Off', 'Combine multiple subscriptions and unlock exclusive bundle discounts!', 'View Bundles', '/bundles', 'from-purple-600 via-pink-600 to-purple-800', 'gift', 2, true),
    ('Fast Delivery', 'Within 2 Hours', 'Get your credentials delivered instantly after payment verification.', 'Learn More', '/contact', 'from-amber-500 via-orange-500 to-red-600', 'clock', 3, true),
    ('100% Secure', 'Verified Accounts', 'All accounts are verified and come with replacement guarantee.', 'Contact Support', '/support', 'from-blue-600 via-indigo-600 to-purple-700', 'shield', 4, true)
ON CONFLICT DO NOTHING;
