-- Optimization: Add indexes to foreign keys to improve query performance

-- Registrations: speeding up user dashboard and tournament registration lists
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_tournament_id ON public.registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);

-- Players: speeding up team details fetching
CREATE INDEX IF NOT EXISTS idx_players_registration_id ON public.players(registration_id);

-- Slots: speeding up slot viewing and assignment
CREATE INDEX IF NOT EXISTS idx_slots_tournament_id ON public.slots(tournament_id);
CREATE INDEX IF NOT EXISTS idx_slots_group_id ON public.slots(group_id);
CREATE INDEX IF NOT EXISTS idx_slots_registration_id ON public.slots(registration_id);

-- Tournaments: speeding up filtering by status and visibility
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_is_published ON public.tournaments(is_published);
