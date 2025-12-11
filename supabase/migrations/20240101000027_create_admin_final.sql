-- This migration creates the admin user using Supabase's auth.users table
-- The password will be: Stevesp123@#

-- First, ensure the promote function exists
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET role = 'admin' WHERE email = user_email;
  RAISE NOTICE 'User % promoted to admin', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Instructions:
-- After this migration runs, you need to:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to Authentication > Users
-- 3. Click "Add user" and create:
--    Email: admin@devsera.store
--    Password: Stevesp123@#
--    Auto Confirm User: YES
-- 4. Then run this SQL in the SQL Editor:
--    SELECT promote_to_admin('admin@devsera.store');

-- Alternatively, if you want to do it via SQL directly (requires service role):
-- You can run this in the Supabase SQL Editor with service role access
