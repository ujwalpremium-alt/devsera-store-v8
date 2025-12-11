CREATE TYPE premium_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
CREATE TYPE premium_plan AS ENUM ('5_year', '10_year', 'lifetime');
CREATE TYPE premium_content_type AS ENUM ('trick', 'guide', 'offer', 'resource');

CREATE TABLE IF NOT EXISTS premium_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_type premium_plan NOT NULL,
  price_paid decimal(10,2) NOT NULL,
  payment_proof_url text,
  payment_method text NOT NULL,
  transaction_id text,
  status premium_status DEFAULT 'pending',
  requested_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid REFERENCES public.profiles(id),
  expires_at timestamptz,
  rejection_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS premium_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  is_free_for_premium boolean DEFAULT false,
  premium_discount_percent integer DEFAULT 0,
  premium_only boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id)
);

CREATE TABLE IF NOT EXISTS premium_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content_type premium_content_type NOT NULL,
  content_url text,
  content_body text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_premium_memberships_user ON premium_memberships(user_id);
CREATE INDEX idx_premium_memberships_status ON premium_memberships(status);
CREATE INDEX idx_premium_products_product ON premium_products(product_id);

ALTER TABLE premium_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own memberships" ON premium_memberships;
CREATE POLICY "Users can view own memberships" ON premium_memberships
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own memberships" ON premium_memberships;
CREATE POLICY "Users can insert own memberships" ON premium_memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all memberships" ON premium_memberships;
CREATE POLICY "Admins can view all memberships" ON premium_memberships
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update memberships" ON premium_memberships;
CREATE POLICY "Admins can update memberships" ON premium_memberships
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Anyone can view premium products" ON premium_products;
CREATE POLICY "Anyone can view premium products" ON premium_products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage premium products" ON premium_products;
CREATE POLICY "Admins can manage premium products" ON premium_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Premium users can view content" ON premium_content;
CREATE POLICY "Premium users can view content" ON premium_content
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM premium_memberships 
      WHERE user_id = auth.uid() 
      AND status = 'approved' 
      AND (expires_at IS NULL OR expires_at > now())
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage premium content" ON premium_content;
CREATE POLICY "Admins can manage premium content" ON premium_content
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

INSERT INTO premium_content (title, description, content_type, content_body, is_active) VALUES
('Free Netflix Trick', 'Get Netflix premium for free using this method', 'trick', 'Step 1: Visit the official Netflix website...', true),
('Amazon Prime Hack', 'Extended trial method for Amazon Prime', 'trick', 'Follow these steps carefully...', true),
('Exclusive Discount Codes', 'Monthly updated discount codes for premium members', 'offer', 'Use code PREMIUM50 for 50% off...', true),
('Complete Guide to Digital Products', 'Master guide for all digital subscriptions', 'guide', 'This comprehensive guide covers...', true);
