-- Add name column if it doesn't exist (for backwards compatibility)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- Update name from full_name if name is null
UPDATE profiles SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;

-- Create or replace the promote_to_admin function
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET role = 'admin' WHERE email = user_email;
  IF NOT FOUND THEN
    RAISE NOTICE 'No user found with email: %', user_email;
  ELSE
    RAISE NOTICE 'User % promoted to admin', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin profile directly if user exists in auth.users but not in profiles
INSERT INTO profiles (id, email, full_name, name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  'admin'
FROM auth.users 
WHERE email = 'admin@devsera.store'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
