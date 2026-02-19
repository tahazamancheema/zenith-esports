-- ============================================
-- SLOT ASSIGNMENT OVERHAUL
-- ============================================

-- 1. Add group_id to slots table
ALTER TABLE public.slots
ADD COLUMN group_id UUID REFERENCES public.tournament_groups(id) ON DELETE CASCADE;

-- 2. Drop old uniqueness constraint (tournament_id, slot_number)
ALTER TABLE public.slots
DROP CONSTRAINT IF EXISTS slots_tournament_id_slot_number_key;

-- 3. Add new uniqueness constraint (group_id, slot_number)
-- Note: We still keep tournament_id for easy querying, but uniqueness is now per group
ALTER TABLE public.slots
ADD CONSTRAINT slots_group_id_slot_number_key UNIQUE (group_id, slot_number);

-- 4. Update initialize_tournament_slots function
-- Old one created slots 6-25 for the whole tournament.
-- New one should maybe be called PER GROUP or loop through groups.
-- Let's make it create slots for ALL existing groups in the tournament.

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

-- 5. Update auto_assign_slot function
-- It must now find the first available slot across all groups, ordered by group sort_order

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

-- 6. Performance Optimization
-- Create index on user_id for faster dashboard loading
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_tournament_id ON public.registrations(tournament_id);
