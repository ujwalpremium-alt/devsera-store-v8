UPDATE auth.users 
SET encrypted_password = crypt('Stevesp123@#', gen_salt('bf'))
WHERE email = 'admin@devsera.store';
