-- Fix RLS policies for loyalty_points to allow users to create their own records

DROP POLICY IF EXISTS "System can manage loyalty points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can view own loyalty points" ON loyalty_points;
DROP POLICY IF EXISTS "Admins can view all loyalty data" ON loyalty_points;

-- Users can view their own loyalty points
CREATE POLICY "Users can view own loyalty points" ON loyalty_points
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own loyalty record
CREATE POLICY "Users can insert own loyalty points" ON loyalty_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own loyalty points
CREATE POLICY "Users can update own loyalty points" ON loyalty_points
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all loyalty data
CREATE POLICY "Admins can view all loyalty data" ON loyalty_points
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can manage all loyalty data
CREATE POLICY "Admins can manage all loyalty data" ON loyalty_points
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Fix referral_codes policies
DROP POLICY IF EXISTS "System can manage referral codes" ON referral_codes;
DROP POLICY IF EXISTS "Users can view own referral code" ON referral_codes;
DROP POLICY IF EXISTS "Anyone can view referral codes" ON referral_codes;

-- Users can view their own referral code
CREATE POLICY "Users can view own referral code" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own referral code
CREATE POLICY "Users can insert own referral code" ON referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can view referral codes (for validation)
CREATE POLICY "Anyone can view referral codes for validation" ON referral_codes
  FOR SELECT USING (true);

-- Fix referrals policies
DROP POLICY IF EXISTS "System can manage referrals" ON referrals;
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;

-- Users can view referrals they're involved in
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Users can insert referrals where they are the referred user
CREATE POLICY "Users can create referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- Fix notification_preferences policies
DROP POLICY IF EXISTS "Users can manage own preferences" ON notification_preferences;

CREATE POLICY "Users can view own preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Fix point_transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON point_transactions;
DROP POLICY IF EXISTS "System can create transactions" ON point_transactions;

CREATE POLICY "Users can view own transactions" ON point_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON point_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix coupons policies
DROP POLICY IF EXISTS "Users can view own coupons" ON coupons;
DROP POLICY IF EXISTS "Users can create coupons" ON coupons;
DROP POLICY IF EXISTS "Users can update own coupons" ON coupons;

CREATE POLICY "Users can view own coupons" ON coupons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own coupons" ON coupons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coupons" ON coupons
  FOR UPDATE USING (auth.uid() = user_id);
