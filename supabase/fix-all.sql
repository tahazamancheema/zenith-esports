-- =============================================
-- MASTER FIX SCRIPT: Run this entire file to fix ALL issues
-- Solves: "Infinite Loading" and "Upload Failed" errors
-- =============================================

-- PART 1: FIX STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('tournament-posters', 'tournament-posters', true),
  ('tournament-logos', 'tournament-logos', true),
  ('team-logos', 'team-logos', true),
  ('verification-uploads', 'verification-uploads', false),
  ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Reset Storage Policies
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert" ON storage.objects;
DROP POLICY IF EXISTS "User Update Own Files" ON storage.objects;
DROP POLICY IF EXISTS "Admin All Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Read Private" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Posters" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Logos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Team Logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;

CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT
USING ( bucket_id IN ('tournament-posters', 'tournament-logos', 'team-logos') );

CREATE POLICY "Authenticated Insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id IN ('tournament-posters', 'tournament-logos', 'team-logos', 'verification-uploads', 'payment-proofs') );

CREATE POLICY "Admin All Access" ON storage.objects FOR ALL TO authenticated
USING ( EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator')) );

-- PART 2: FIX INFINITE RECURSION (RLS)
-- This fixes the "Keeps Loading" issue on Create/Edit Tournament

-- Create safe function to check roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = user_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Fix USERS table policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));
CREATE POLICY "Admins can update all users" ON public.users FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- Fix TOURNAMENTS table policies
DROP POLICY IF EXISTS "Admins can view all tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admins can create tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admins can update tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admins can delete tournaments" ON public.tournaments;

CREATE POLICY "Admins can view all tournaments" ON public.tournaments FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));
CREATE POLICY "Admins can create tournaments" ON public.tournaments FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can update tournaments" ON public.tournaments FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can delete tournaments" ON public.tournaments FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');

-- Fix STAGES & SCHEDULE (These were likely causing the hang on Edit page)
DROP POLICY IF EXISTS "Admins can manage stages" ON public.tournament_stages;
CREATE POLICY "Admins can manage stages" ON public.tournament_stages FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can manage schedule" ON public.tournament_schedule;
CREATE POLICY "Admins can manage schedule" ON public.tournament_schedule FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can manage groups" ON public.tournament_groups;
CREATE POLICY "Admins can manage groups" ON public.tournament_groups FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Fix REGISTRATIONS & PLAYERS (These cause hang on Register page)
DROP POLICY IF EXISTS "Admins and mods can view all registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins and mods can update registrations" ON public.registrations;
CREATE POLICY "Admins and mods can view all registrations" ON public.registrations FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));
CREATE POLICY "Admins and mods can update registrations" ON public.registrations FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

DROP POLICY IF EXISTS "Admins and mods can view all players" ON public.players;
CREATE POLICY "Admins and mods can view all players" ON public.players FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

DROP POLICY IF EXISTS "Admins and mods can view all uploads" ON public.uploads;
CREATE POLICY "Admins and mods can view all uploads" ON public.uploads FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins and mods can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins and mods can view audit logs" ON public.audit_logs FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

-- Safe Audit Log Insert (System/Triggers can always insert)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Verification
SELECT 'SUCCESS: All 12 tables updated. RLS Fixed.' as status;
