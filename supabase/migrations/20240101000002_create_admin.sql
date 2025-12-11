-- Note: You must first create the user through Supabase Auth Dashboard or app registration
-- Then update their role to admin using their email

-- This is a helper function to promote a user to admin by email
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET role = 'admin' 
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- After creating the user admin@devsera.store through signup, run:
-- SELECT promote_to_admin('admin@devsera.store');
