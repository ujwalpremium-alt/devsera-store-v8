-- Re-seed products data if table is empty

-- First ensure the products table has all required columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_active') THEN
        ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'delivery_type') THEN
        ALTER TABLE products ADD COLUMN delivery_type TEXT DEFAULT 'CREDENTIALS';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'delivery_instructions') THEN
        ALTER TABLE products ADD COLUMN delivery_instructions TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'requires_user_input') THEN
        ALTER TABLE products ADD COLUMN requires_user_input BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'user_input_label') THEN
        ALTER TABLE products ADD COLUMN user_input_label TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'requires_password') THEN
        ALTER TABLE products ADD COLUMN requires_password BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'has_variants') THEN
        ALTER TABLE products ADD COLUMN has_variants BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'cost_price') THEN
        ALTER TABLE products ADD COLUMN cost_price INTEGER DEFAULT 0;
    END IF;
END $$;

-- Insert sample products only if table is empty
INSERT INTO products (name, description, image, original_price, sale_price, duration, features, category, is_active, delivery_type, delivery_instructions)
SELECT * FROM (VALUES
  ('Canva Pro', 'Access premium design tools, templates, and features', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80', 1299, 199, '1 Month', ARRAY['Unlimited premium templates', 'Brand kit & fonts', 'Background remover', 'Magic resize', 'Team collaboration'], 'Design', true, 'CREDENTIALS', 'You will receive login credentials within 2 hours of payment verification.'),
  ('LinkedIn Premium', 'Unlock career opportunities with premium features', 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=800&q=80', 1999, 299, '1 Month', ARRAY['InMail messages', 'See who viewed your profile', 'LinkedIn Learning access', 'Applicant insights', 'Premium badge'], 'Professional', true, 'MANUAL_ACTIVATION', 'We will upgrade your existing LinkedIn account to Premium.'),
  ('Netflix Premium', 'Stream unlimited movies and TV shows in 4K', 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&q=80', 649, 149, '1 Month', ARRAY['4K Ultra HD streaming', '4 screens at once', 'Download on 6 devices', 'No ads', 'Unlimited content'], 'Entertainment', true, 'CREDENTIALS', 'You will receive login credentials within 2 hours of payment verification.'),
  ('Spotify Premium', 'Ad-free music streaming with offline downloads', 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800&q=80', 119, 79, '1 Month', ARRAY['Ad-free listening', 'Offline downloads', 'High quality audio', 'Unlimited skips', 'Play any song'], 'Entertainment', true, 'CREDENTIALS', 'You will receive login credentials within 2 hours of payment verification.'),
  ('ChatGPT Plus', 'Access GPT-4 and advanced AI features', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80', 1600, 399, '1 Month', ARRAY['GPT-4 access', 'Faster response times', 'Priority access', 'Advanced data analysis', 'DALL-E 3 integration'], 'AI Tools', true, 'CREDENTIALS', 'You will receive login credentials within 2 hours of payment verification.'),
  ('YouTube Premium', 'Ad-free videos, background play, and downloads', 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&q=80', 129, 89, '1 Month', ARRAY['Ad-free videos', 'Background playback', 'Offline downloads', 'YouTube Music Premium', 'Picture-in-picture'], 'Entertainment', true, 'CREDENTIALS', 'You will receive login credentials within 2 hours of payment verification.')
) AS v(name, description, image, original_price, sale_price, duration, features, category, is_active, delivery_type, delivery_instructions)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

-- Update LinkedIn Premium to require user input
UPDATE products SET 
  requires_user_input = true, 
  user_input_label = 'Your LinkedIn Email'
WHERE name = 'LinkedIn Premium';

-- Insert default settings if not exists
INSERT INTO settings (upi_id, qr_code_url, telegram_link, contact_email, contact_phone)
SELECT 'devsera@paytm', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&q=80', 'https://t.me/devserasupport', 'support@devsera.store', '+91 98765 43210'
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);
