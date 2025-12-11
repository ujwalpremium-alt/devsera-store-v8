-- Add flash_sale_config column to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS flash_sale_config JSONB DEFAULT NULL;
