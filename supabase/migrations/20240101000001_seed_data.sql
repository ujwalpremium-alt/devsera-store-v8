-- Insert sample products
INSERT INTO products (name, description, image, original_price, sale_price, duration, features, category) VALUES
('Canva Pro', 'Access premium design tools, templates, and features', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80', 1299, 199, '1 Month', ARRAY['Unlimited premium templates', 'Brand kit & fonts', 'Background remover', 'Magic resize', 'Team collaboration'], 'Design'),
('LinkedIn Premium', 'Unlock career opportunities with premium features', 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=800&q=80', 1999, 299, '1 Month', ARRAY['InMail messages', 'See who viewed your profile', 'LinkedIn Learning access', 'Applicant insights', 'Premium badge'], 'Professional'),
('Netflix Premium', 'Stream unlimited movies and TV shows in 4K', 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&q=80', 649, 149, '1 Month', ARRAY['4K Ultra HD streaming', '4 screens at once', 'Download on 6 devices', 'No ads', 'Unlimited content'], 'Entertainment'),
('Spotify Premium', 'Ad-free music streaming with offline downloads', 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800&q=80', 119, 79, '1 Month', ARRAY['Ad-free listening', 'Offline downloads', 'High quality audio', 'Unlimited skips', 'Play any song'], 'Entertainment'),
('ChatGPT Plus', 'Access GPT-4 and advanced AI features', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80', 1600, 399, '1 Month', ARRAY['GPT-4 access', 'Faster response times', 'Priority access', 'Advanced data analysis', 'DALL-E 3 integration'], 'AI Tools'),
('YouTube Premium', 'Ad-free videos, background play, and downloads', 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&q=80', 129, 89, '1 Month', ARRAY['Ad-free videos', 'Background playback', 'Offline downloads', 'YouTube Music Premium', 'Picture-in-picture'], 'Entertainment');

-- Insert default settings
INSERT INTO settings (upi_id, qr_code_url, telegram_link, contact_email, contact_phone) VALUES
('devsera@paytm', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&q=80', 'https://t.me/devserasupport', 'support@devsera.store', '+91 98765 43210');
