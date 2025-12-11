CREATE TABLE IF NOT EXISTS premium_coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  coupon_content_id uuid REFERENCES public.premium_content(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  used_at timestamptz DEFAULT now(),
  UNIQUE(user_id, coupon_content_id, product_id)
);

CREATE INDEX idx_premium_coupon_usage_user ON premium_coupon_usage(user_id);
CREATE INDEX idx_premium_coupon_usage_coupon ON premium_coupon_usage(coupon_content_id);

ALTER TABLE premium_coupon_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own coupon usage" ON premium_coupon_usage;
CREATE POLICY "Users can view own coupon usage" ON premium_coupon_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own coupon usage" ON premium_coupon_usage;
CREATE POLICY "Users can insert own coupon usage" ON premium_coupon_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage coupon usage" ON premium_coupon_usage;
CREATE POLICY "Admins can manage coupon usage" ON premium_coupon_usage
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
