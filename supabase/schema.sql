-- Zenith Esports Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = user_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

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

-- Auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TOURNAMENTS TABLE
-- ============================================
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  game TEXT NOT NULL DEFAULT 'pubg_mobile',
  description TEXT,
  prize_pool TEXT,
  mvp_prize TEXT,
  server_region TEXT DEFAULT 'Asia',
  poster_url TEXT,
  logo_url TEXT,
  registration_start TIMESTAMPTZ,
  registration_end TIMESTAMPTZ,
  match_start TIMESTAMPTZ,
  match_end TIMESTAMPTZ,
  total_team_capacity INTEGER NOT NULL DEFAULT 20,
  teams_per_group INTEGER DEFAULT 0,
  max_players_per_team INTEGER NOT NULL DEFAULT 5,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registration_open', 'registration_closed', 'live', 'completed')),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published tournaments" ON public.tournaments
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can view all tournaments" ON public.tournaments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "Admins can create tournaments" ON public.tournaments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update tournaments" ON public.tournaments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete tournaments" ON public.tournaments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- TOURNAMENT STAGES (Roadmap)
-- ============================================
CREATE TABLE public.tournament_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tournament_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stages of published tournaments" ON public.tournament_stages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tournaments WHERE id = tournament_id AND is_published = true)
  );

CREATE POLICY "Admins can manage stages" ON public.tournament_stages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- TOURNAMENT SCHEDULE (Calendar)
-- ============================================
CREATE TABLE public.tournament_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  match_date TIMESTAMPTZ NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tournament_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view schedule of published tournaments" ON public.tournament_schedule
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tournaments WHERE id = tournament_id AND is_published = true)
  );

CREATE POLICY "Admins can manage schedule" ON public.tournament_schedule
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- TOURNAMENT GROUPS
-- ============================================
CREATE TABLE public.tournament_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tournament_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view groups of published tournaments" ON public.tournament_groups
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tournaments WHERE id = tournament_id AND is_published = true)
  );

CREATE POLICY "Admins can manage groups" ON public.tournament_groups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- REGISTRATION FORM CONFIG
-- ============================================
CREATE TABLE public.registration_form_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'dropdown', 'file', 'textarea')),
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  options JSONB, -- for dropdown options
  sort_order INTEGER NOT NULL DEFAULT 0,
  section TEXT NOT NULL DEFAULT 'custom' CHECK (section IN ('team', 'player', 'verification', 'custom')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.registration_form_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view form config of published tournaments" ON public.registration_form_config
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tournaments WHERE id = tournament_id AND is_published = true)
  );

CREATE POLICY "Admins and mods can view all form configs" ON public.registration_form_config
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "Admins can manage form config" ON public.registration_form_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- REGISTRATIONS (State Machine)
-- ============================================
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  team_name TEXT NOT NULL,
  team_logo_url TEXT,
  whatsapp_raw TEXT NOT NULL,
  whatsapp_normalized TEXT NOT NULL,
  discord TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'assigned_slot')),
  group_id UUID REFERENCES public.tournament_groups(id),
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tournament_id, user_id),
  UNIQUE(tournament_id, team_name)
);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own registrations" ON public.registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create registrations" ON public.registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and mods can view all registrations" ON public.registrations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "Admins and mods can update registrations" ON public.registrations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "Public can view approved registrations" ON public.registrations
  FOR SELECT USING (status IN ('approved', 'assigned_slot'));

-- ============================================
-- PLAYERS
-- ============================================
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  ign TEXT NOT NULL,
  character_id TEXT NOT NULL,
  discord TEXT,
  is_captain BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view players of own registration" ON public.players
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.registrations WHERE id = registration_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create players for own registration" ON public.players
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.registrations WHERE id = registration_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins and mods can view all players" ON public.players
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "Public can view players of approved registrations" ON public.players
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.registrations WHERE id = registration_id AND status IN ('approved', 'assigned_slot'))
  );

-- ============================================
-- SLOTS (6–25)
-- ============================================
CREATE TABLE public.slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.tournament_groups(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
  slot_number INTEGER NOT NULL CHECK (slot_number >= 6 AND slot_number <= 25),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES public.users(id),
  UNIQUE(tournament_id, registration_id),
  UNIQUE(group_id, slot_number)
);

ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view slots of published tournaments" ON public.slots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tournaments WHERE id = tournament_id AND is_published = true)
  );

CREATE POLICY "Admins and mods can view all slots" ON public.slots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "Admins and mods can manage slots" ON public.slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- ============================================
-- UPLOADS (Verification + Payment Proof)
-- ============================================
CREATE TABLE public.uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('verification', 'payment_proof', 'team_logo')),
  field_name TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own uploads" ON public.uploads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.registrations WHERE id = registration_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create uploads for own registration" ON public.uploads
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.registrations WHERE id = registration_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins and mods can view all uploads" ON public.uploads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins and mods can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- CONTACT SUBMISSIONS
-- ============================================
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view contact submissions" ON public.contact_submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update contact submissions" ON public.contact_submissions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- INITIALIZE SLOTS FOR A TOURNAMENT (Function)
-- ============================================
CREATE OR REPLACE FUNCTION public.initialize_tournament_slots(p_tournament_id UUID)
RETURNS VOID AS $$
DECLARE
  v_group RECORD;
BEGIN
  -- Loop through all groups in this tournament
  FOR v_group IN SELECT id FROM public.tournament_groups WHERE tournament_id = p_tournament_id LOOP
    -- Insert slots 6-25 for this group
    INSERT INTO public.slots (tournament_id, group_id, slot_number)
    SELECT p_tournament_id, v_group.id, generate_series(6, 25)
    ON CONFLICT (group_id, slot_number) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUTO-ASSIGN NEXT AVAILABLE SLOT (Function)
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_assign_slot(
  p_tournament_id UUID,
  p_registration_id UUID,
  p_assigned_by UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_slot_id UUID;
  v_slot_number INTEGER;
  v_group_id UUID;
BEGIN
  -- Find next available slot:
  -- Join slots with groups to order by group sort_order, then slot_number
  SELECT s.id, s.slot_number, s.group_id
  INTO v_slot_id, v_slot_number, v_group_id
  FROM public.slots s
  JOIN public.tournament_groups g ON s.group_id = g.id
  WHERE s.tournament_id = p_tournament_id
    AND s.registration_id IS NULL
  ORDER BY g.sort_order ASC, s.slot_number ASC
  LIMIT 1
  FOR UPDATE OF s SKIP LOCKED;

  IF v_slot_id IS NULL THEN
    RAISE EXCEPTION 'No available slots for this tournament';
  END IF;

  -- Assign the slot
  UPDATE public.slots
  SET registration_id = p_registration_id,
      assigned_at = NOW(),
      assigned_by = p_assigned_by
  WHERE id = v_slot_id;

  -- Update registration status AND assign them to the group
  UPDATE public.registrations
  SET status = 'assigned_slot',
      group_id = v_group_id,
      updated_at = NOW()
  WHERE id = p_registration_id;

  RETURN v_slot_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Run these via Supabase Dashboard or API:
-- 1. tournament-assets (posters, logos)
-- 2. team-assets (team logos)
-- 3. verification-uploads (rank proof, etc.)
-- 4. payment-proofs

-- Storage bucket policies should allow:
-- - Public read for tournament-assets and team-assets
-- - Authenticated upload for team-assets, verification-uploads, payment-proofs
-- - Admin/mod read for verification-uploads and payment-proofs
