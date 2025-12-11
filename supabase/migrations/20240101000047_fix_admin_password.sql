UPDATE auth.users 
SET encrypted_password = crypt('Stevesp123@#', gen_salt('bf')),
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'admin@devsera.store';

UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@devsera.store';
