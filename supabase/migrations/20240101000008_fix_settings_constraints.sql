-- Fix settings table - make columns nullable and add default values
ALTER TABLE settings ALTER COLUMN upi_id DROP NOT NULL;
ALTER TABLE settings ALTER COLUMN qr_code_url DROP NOT NULL;
ALTER TABLE settings ALTER COLUMN telegram_link DROP NOT NULL;
ALTER TABLE settings ALTER COLUMN contact_email DROP NOT NULL;
ALTER TABLE settings ALTER COLUMN contact_phone DROP NOT NULL;

ALTER TABLE settings ALTER COLUMN upi_id SET DEFAULT '';
ALTER TABLE settings ALTER COLUMN qr_code_url SET DEFAULT '';
ALTER TABLE settings ALTER COLUMN telegram_link SET DEFAULT '';
ALTER TABLE settings ALTER COLUMN contact_email SET DEFAULT '';
ALTER TABLE settings ALTER COLUMN contact_phone SET DEFAULT '';

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only admins can update settings" ON settings;
DROP POLICY IF EXISTS "Only admins can insert settings" ON settings;

-- Create more permissive policies for settings
CREATE POLICY "Admins can insert settings" ON settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update settings" ON settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete settings" ON settings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert default settings row if none exists
INSERT INTO settings (upi_id, qr_code_url, telegram_link, contact_email, contact_phone)
SELECT '', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);
