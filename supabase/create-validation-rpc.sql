-- =============================================
-- FIX: Registration Validation Logic
-- Run this ENTIRE script in Supabase SQL Editor
-- =============================================

-- Create a function to check for conflicts (WhatsApp, Char IDs, IGNs)
-- We use SECURITY DEFINER to allow checking across all registrations even with RLS
CREATE OR REPLACE FUNCTION public.check_registration_conflicts(
  p_tournament_id UUID,
  p_whatsapp TEXT,
  p_player_ids TEXT[],
  p_player_igns TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conflict_found BOOLEAN;
  conflicting_field TEXT;
  conflicting_value TEXT;
BEGIN
  -- 1. Check WhatsApp (exclude rejected registrations)
  SELECT TRUE, 'whatsapp', p_whatsapp
  INTO conflict_found, conflicting_field, conflicting_value
  FROM public.registrations
  WHERE tournament_id = p_tournament_id
    AND status != 'rejected'
    AND whatsapp_normalized = p_whatsapp
  LIMIT 1;

  IF conflict_found THEN
    RETURN jsonb_build_object('conflict', true, 'field', 'whatsapp', 'value', conflicting_value, 'message', 'This WhatsApp number is already registered for this tournament.');
  END IF;

  -- 2. Check Player Character IDs
  -- We join players -> registrations to filter by tournament and status
  SELECT TRUE, 'character_id', p.character_id
  INTO conflict_found, conflicting_field, conflicting_value
  FROM public.players p
  JOIN public.registrations r ON p.registration_id = r.id
  WHERE r.tournament_id = p_tournament_id
    AND r.status != 'rejected'
    AND p.character_id = ANY(p_player_ids)
  LIMIT 1;

  IF conflict_found THEN
    RETURN jsonb_build_object('conflict', true, 'field', 'character_id', 'value', conflicting_value, 'message', 'Character ID ' || conflicting_value || ' is already registered.');
  END IF;

  -- 3. Check Player IGNs (Case insensitive?)
  -- Let's do exact match for now to be safe, or ILIKE if needed.
  -- "no same name or id is repeated" usually implies exact or case-insensitive overlap.
  SELECT TRUE, 'ign', p.ign
  INTO conflict_found, conflicting_field, conflicting_value
  FROM public.players p
  JOIN public.registrations r ON p.registration_id = r.id
  WHERE r.tournament_id = p_tournament_id
    AND r.status != 'rejected'
    AND LOWER(p.ign) = ANY(array((SELECT LOWER(x) FROM unnest(p_player_igns) x)))
  LIMIT 1;

  IF conflict_found THEN
    RETURN jsonb_build_object('conflict', true, 'field', 'ign', 'value', conflicting_value, 'message', 'Player Name (IGN) ' || conflicting_value || ' is already taken.');
  END IF;

  -- No conflicts
  RETURN jsonb_build_object('conflict', false);
END;
$$;
