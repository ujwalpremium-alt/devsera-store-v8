-- Delete existing admin user if exists and recreate
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Delete existing admin user
  DELETE FROM auth.users WHERE email = 'admin@devsera.store' RETURNING id INTO admin_user_id;
  
  IF admin_user_id IS NOT NULL THEN
    DELETE FROM profiles WHERE id = admin_user_id;
    RAISE NOTICE 'Deleted existing admin user';
  END IF;
END $$;

-- Now create fresh admin user
-- Note: After running this migration, you need to:
-- 1. Register at the app with email: admin@devsera.store and password: Stevesp123@#
-- 2. Then run the following SQL to promote to admin:
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@devsera.store';

-- Or use this function to promote after registration:
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET role = 'admin' WHERE email = user_email;
  RAISE NOTICE 'User % promoted to admin', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
