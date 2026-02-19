-- =============================================
-- FIX: Infinite recursion in users table RLS
-- Run this ENTIRE script in Supabase SQL Editor
-- =============================================

-- Step 1: Create a SECURITY DEFINER function to check roles
-- This bypasses RLS so it won't cause recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = user_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 2: Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- Step 3: Recreate policies WITHOUT self-referencing queries
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('admin', 'moderator')
  );

CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- Step 4: Ensure your admin profile exists
INSERT INTO public.users (id, email, full_name, role)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', ''), 'admin'
FROM auth.users
WHERE email = 'tahazamancheema@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Step 5: Also fix policies on other tables that reference public.users
-- (These don't cause recursion but let's use the function for consistency)

-- tournaments
DROP POLICY IF EXISTS "Admins can view all tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admins can create tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admins can update tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admins can delete tournaments" ON public.tournaments;

CREATE POLICY "Admins can view all tournaments" ON public.tournaments
  FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));
CREATE POLICY "Admins can create tournaments" ON public.tournaments
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can update tournaments" ON public.tournaments
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can delete tournaments" ON public.tournaments
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');

-- tournament_stages
DROP POLICY IF EXISTS "Admins can manage stages" ON public.tournament_stages;
CREATE POLICY "Admins can manage stages" ON public.tournament_stages
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- tournament_schedule
DROP POLICY IF EXISTS "Admins can manage schedule" ON public.tournament_schedule;
CREATE POLICY "Admins can manage schedule" ON public.tournament_schedule
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- tournament_groups
DROP POLICY IF EXISTS "Admins can manage groups" ON public.tournament_groups;
CREATE POLICY "Admins can manage groups" ON public.tournament_groups
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- registration_form_config
DROP POLICY IF EXISTS "Admins and mods can view all form configs" ON public.registration_form_config;
DROP POLICY IF EXISTS "Admins can manage form config" ON public.registration_form_config;
CREATE POLICY "Admins and mods can view all form configs" ON public.registration_form_config
  FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));
CREATE POLICY "Admins can manage form config" ON public.registration_form_config
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- registrations
DROP POLICY IF EXISTS "Admins and mods can view all registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins and mods can update registrations" ON public.registrations;
CREATE POLICY "Admins and mods can view all registrations" ON public.registrations
  FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));
CREATE POLICY "Admins and mods can update registrations" ON public.registrations
  FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

-- players
DROP POLICY IF EXISTS "Admins and mods can view all players" ON public.players;
CREATE POLICY "Admins and mods can view all players" ON public.players
  FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

-- slots
DROP POLICY IF EXISTS "Admins and mods can view all slots" ON public.slots;
DROP POLICY IF EXISTS "Admins and mods can manage slots" ON public.slots;
CREATE POLICY "Admins and mods can view all slots" ON public.slots
  FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));
CREATE POLICY "Admins and mods can manage slots" ON public.slots
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

-- uploads
DROP POLICY IF EXISTS "Admins and mods can view all uploads" ON public.uploads;
CREATE POLICY "Admins and mods can view all uploads" ON public.uploads
  FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

-- audit_logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins and mods can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins and mods can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

-- contact_submissions
DROP POLICY IF EXISTS "Admins can view contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can update contact submissions" ON public.contact_submissions;
CREATE POLICY "Admins can view contact submissions" ON public.contact_submissions
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can update contact submissions" ON public.contact_submissions
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- Done! Verify:
SELECT id, email, role FROM public.users WHERE email = 'tahazamancheema@gmail.com';
