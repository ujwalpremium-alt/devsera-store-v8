ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_view_products BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_edit_products BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_delete_products BOOLEAN DEFAULT false;

ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_view_bundles BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_edit_bundles BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_delete_bundles BOOLEAN DEFAULT false;

ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_view_flash_sales BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_edit_flash_sales BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_delete_flash_sales BOOLEAN DEFAULT false;

ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_view_orders BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_edit_orders BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_delete_orders BOOLEAN DEFAULT false;

ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_view_customers BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_edit_customers BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_delete_customers BOOLEAN DEFAULT false;

ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_view_tickets BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_edit_tickets BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_delete_tickets BOOLEAN DEFAULT false;

ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_view_premium BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_edit_premium BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_delete_premium BOOLEAN DEFAULT false;

ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_view_rewards BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_edit_rewards BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_delete_rewards BOOLEAN DEFAULT false;

ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_view_community BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_edit_community BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_delete_community BOOLEAN DEFAULT false;

ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_view_settings BOOLEAN DEFAULT false;
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS can_edit_settings BOOLEAN DEFAULT false;
