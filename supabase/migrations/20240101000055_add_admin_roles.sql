CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'moderator');

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_role admin_role;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  can_manage_products BOOLEAN DEFAULT false,
  can_manage_orders BOOLEAN DEFAULT false,
  can_manage_customers BOOLEAN DEFAULT false,
  can_manage_bundles BOOLEAN DEFAULT false,
  can_manage_flash_sales BOOLEAN DEFAULT false,
  can_manage_premium BOOLEAN DEFAULT false,
  can_manage_rewards BOOLEAN DEFAULT false,
  can_manage_community BOOLEAN DEFAULT false,
  can_manage_tickets BOOLEAN DEFAULT false,
  can_manage_settings BOOLEAN DEFAULT false,
  can_manage_admins BOOLEAN DEFAULT false,
  can_delete_data BOOLEAN DEFAULT false,
  can_edit_data BOOLEAN DEFAULT true,
  can_view_reports BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(admin_id)
);

ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage all permissions" ON admin_permissions;
CREATE POLICY "Super admins can manage all permissions" ON admin_permissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND admin_role = 'super_admin')
  );

DROP POLICY IF EXISTS "Admins can view own permissions" ON admin_permissions;
CREATE POLICY "Admins can view own permissions" ON admin_permissions
  FOR SELECT USING (admin_id = auth.uid());

UPDATE profiles SET admin_role = 'super_admin' WHERE role = 'admin' AND admin_role IS NULL;

CREATE OR REPLACE FUNCTION update_admin_permissions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_permissions_timestamp ON admin_permissions;
CREATE TRIGGER update_admin_permissions_timestamp
  BEFORE UPDATE ON admin_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_permissions_timestamp();
