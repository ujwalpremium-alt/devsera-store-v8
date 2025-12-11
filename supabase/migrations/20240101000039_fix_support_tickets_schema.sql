-- Fix support_tickets table - add missing columns

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'category') THEN
        ALTER TABLE support_tickets ADD COLUMN category TEXT DEFAULT 'general';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'description') THEN
        ALTER TABLE support_tickets ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'responded_at') THEN
        ALTER TABLE support_tickets ADD COLUMN responded_at TIMESTAMPTZ;
    END IF;
END $$;

-- Copy message to description if description is null and message exists
UPDATE support_tickets SET description = message WHERE description IS NULL AND message IS NOT NULL;
