CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  upi_id TEXT NOT NULL DEFAULT '',
  qr_code_url TEXT NOT NULL DEFAULT '',
  telegram_link TEXT NOT NULL DEFAULT '',
  telegram_username TEXT DEFAULT '@karthik_nkn',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

INSERT INTO settings (upi_id, qr_code_url, telegram_link, contact_email, contact_phone)
SELECT 'yourname@upi', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);
