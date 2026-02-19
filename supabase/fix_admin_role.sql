-- Replace 'YOUR_EMAIL_HERE' with your actual email address
-- Run this in the Supabase SQL Editor

-- 1. Ensure the user exists in the public.users table and is an admin
INSERT INTO public.users (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', email),
    'admin' -- Force role to admin
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';

-- 2. Verify the change
SELECT * FROM public.users WHERE email = 'YOUR_EMAIL_HERE';
