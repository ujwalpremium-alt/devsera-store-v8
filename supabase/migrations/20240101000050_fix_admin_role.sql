DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@devsera.store';
  
  IF admin_user_id IS NOT NULL THEN
    UPDATE public.profiles 
    SET role = 'admin' 
    WHERE id = admin_user_id;
    
    IF NOT FOUND THEN
      INSERT INTO public.profiles (id, email, name, full_name, role)
      VALUES (admin_user_id, 'admin@devsera.store', 'Admin User', 'Admin User', 'admin')
      ON CONFLICT (id) DO UPDATE SET role = 'admin';
    END IF;
  END IF;
END $$;
