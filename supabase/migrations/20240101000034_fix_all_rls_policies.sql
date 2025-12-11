-- Comprehensive fix for all RLS policies and storage

-- =====================================================
-- PROFILES TABLE
-- =====================================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- ORDERS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;

CREATE POLICY "orders_select" ON orders FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update" ON orders FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "orders_delete" ON orders FOR DELETE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Only admins can insert products" ON products;
DROP POLICY IF EXISTS "Only admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

CREATE POLICY "products_select" ON products FOR SELECT USING (
  is_active = true OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "products_update" ON products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "products_delete" ON products FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================================================
-- PRODUCT_VARIANTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view product variants" ON product_variants;
DROP POLICY IF EXISTS "Anyone can view active variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can manage product variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can manage variants" ON product_variants;

CREATE POLICY "variants_select" ON product_variants FOR SELECT USING (true);

CREATE POLICY "variants_admin" ON product_variants FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================================================
-- PRODUCT_STOCK_KEYS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all stock keys" ON product_stock_keys;
DROP POLICY IF EXISTS "Admins can manage stock keys" ON product_stock_keys;

CREATE POLICY "stock_keys_admin" ON product_stock_keys FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================================================
-- ACCOUNTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Only admins can view accounts" ON accounts;
DROP POLICY IF EXISTS "Only admins can insert accounts" ON accounts;
DROP POLICY IF EXISTS "Only admins can update accounts" ON accounts;
DROP POLICY IF EXISTS "Users can view own accounts" ON accounts;
DROP POLICY IF EXISTS "Admins can manage accounts" ON accounts;

CREATE POLICY "accounts_select" ON accounts FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = accounts.order_id AND orders.user_id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "accounts_admin" ON accounts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================================================
-- COMMUNITY_POSTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON community_posts;
DROP POLICY IF EXISTS "Anyone can view posts" ON community_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON community_posts;
DROP POLICY IF EXISTS "Admins can delete any post" ON community_posts;
DROP POLICY IF EXISTS "Admins can update any post" ON community_posts;
DROP POLICY IF EXISTS "Authenticated users can like posts" ON community_posts;

CREATE POLICY "posts_select" ON community_posts FOR SELECT USING (true);

CREATE POLICY "posts_insert" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update" ON community_posts FOR UPDATE USING (
  auth.uid() = user_id OR 
  auth.uid() IS NOT NULL OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "posts_delete" ON community_posts FOR DELETE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================================================
-- REVIEWS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can delete any review" ON reviews;
DROP POLICY IF EXISTS "Admins can update any review" ON reviews;

CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);

CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_update" ON reviews FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "reviews_delete" ON reviews FOR DELETE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================================================
-- BUNDLES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view active bundles" ON bundles;
DROP POLICY IF EXISTS "Admins can manage bundles" ON bundles;

CREATE POLICY "bundles_select" ON bundles FOR SELECT USING (
  is_active = true OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "bundles_admin" ON bundles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================================================
-- BUNDLE_PRODUCTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view bundle products" ON bundle_products;
DROP POLICY IF EXISTS "Admins can manage bundle products" ON bundle_products;

CREATE POLICY "bundle_products_select" ON bundle_products FOR SELECT USING (true);

CREATE POLICY "bundle_products_admin" ON bundle_products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================================================
-- SUPPORT_TICKETS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can delete tickets" ON support_tickets;

CREATE POLICY "tickets_select" ON support_tickets FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "tickets_insert" ON support_tickets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "tickets_update" ON support_tickets FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "tickets_delete" ON support_tickets FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================================================
-- LOYALTY_POINTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own loyalty points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can insert own loyalty points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can update own loyalty points" ON loyalty_points;
DROP POLICY IF EXISTS "Admins can view all loyalty data" ON loyalty_points;
DROP POLICY IF EXISTS "Admins can manage all loyalty data" ON loyalty_points;
DROP POLICY IF EXISTS "System can manage loyalty points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can view own points" ON loyalty_points;
DROP POLICY IF EXISTS "System can manage points" ON loyalty_points;

CREATE POLICY "loyalty_select" ON loyalty_points FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "loyalty_insert" ON loyalty_points FOR INSERT WITH CHECK (true);

CREATE POLICY "loyalty_update" ON loyalty_points FOR UPDATE USING (true);

-- =====================================================
-- POINT_TRANSACTIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own transactions" ON point_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON point_transactions;
DROP POLICY IF EXISTS "System can create transactions" ON point_transactions;

CREATE POLICY "point_trans_select" ON point_transactions FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "point_trans_insert" ON point_transactions FOR INSERT WITH CHECK (true);

-- =====================================================
-- REFERRAL_CODES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own referral code" ON referral_codes;
DROP POLICY IF EXISTS "Users can insert own referral code" ON referral_codes;
DROP POLICY IF EXISTS "Anyone can view referral codes" ON referral_codes;
DROP POLICY IF EXISTS "Anyone can view referral codes for validation" ON referral_codes;
DROP POLICY IF EXISTS "System can manage referral codes" ON referral_codes;

CREATE POLICY "referral_codes_select" ON referral_codes FOR SELECT USING (true);

CREATE POLICY "referral_codes_insert" ON referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "referral_codes_update" ON referral_codes FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- REFERRALS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON referrals;
DROP POLICY IF EXISTS "System can manage referrals" ON referrals;
DROP POLICY IF EXISTS "Admins can view all referrals" ON referrals;

CREATE POLICY "referrals_select" ON referrals FOR SELECT USING (
  auth.uid() = referrer_id OR 
  auth.uid() = referred_id OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "referrals_insert" ON referrals FOR INSERT WITH CHECK (auth.uid() = referred_id);

CREATE POLICY "referrals_update" ON referrals FOR UPDATE USING (true);

-- =====================================================
-- COUPONS TABLE - Handle both schema versions
-- =====================================================
DROP POLICY IF EXISTS "Users can view own coupons" ON coupons;
DROP POLICY IF EXISTS "Users can create own coupons" ON coupons;
DROP POLICY IF EXISTS "Users can create coupons" ON coupons;
DROP POLICY IF EXISTS "Users can update own coupons" ON coupons;
DROP POLICY IF EXISTS "Admins can view all coupons" ON coupons;

CREATE POLICY "coupons_select" ON coupons FOR SELECT USING (true);

CREATE POLICY "coupons_insert" ON coupons FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "coupons_update" ON coupons FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================================================
-- SETTINGS TABLE - Disable RLS for public access
-- =====================================================
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Drop all existing storage policies
DROP POLICY IF EXISTS "Anyone can read order files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload order files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update order files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete order files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for order-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to order-files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from product-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for settings-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to settings-files" ON storage.objects;

-- Ensure buckets exist
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('order-files', 'order-files', true, 10485760)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('product-images', 'product-images', true, 5242880)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('settings-files', 'settings-files', true, 5242880)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

-- Create storage policies for order-files
CREATE POLICY "storage_order_files_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'order-files');

CREATE POLICY "storage_order_files_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'order-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "storage_order_files_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'order-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "storage_order_files_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'order-files' AND auth.uid() IS NOT NULL);

-- Create storage policies for product-images
CREATE POLICY "storage_product_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "storage_product_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "storage_product_images_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "storage_product_images_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- Create storage policies for settings-files
CREATE POLICY "storage_settings_files_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'settings-files');

CREATE POLICY "storage_settings_files_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'settings-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "storage_settings_files_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'settings-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "storage_settings_files_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'settings-files' AND auth.uid() IS NOT NULL);

-- =====================================================
-- TRIGGER FOR AUTO-CREATING PROFILES
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
