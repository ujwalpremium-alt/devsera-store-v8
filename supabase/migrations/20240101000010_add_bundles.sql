CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  original_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bundle_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bundle_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_bundle_products_bundle ON bundle_products(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_products_product ON bundle_products(product_id);

ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active bundles" ON bundles;
CREATE POLICY "Anyone can view active bundles" ON bundles
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage bundles" ON bundles;
CREATE POLICY "Admins can manage bundles" ON bundles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Anyone can view bundle products" ON bundle_products;
CREATE POLICY "Anyone can view bundle products" ON bundle_products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage bundle products" ON bundle_products;
CREATE POLICY "Admins can manage bundle products" ON bundle_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
