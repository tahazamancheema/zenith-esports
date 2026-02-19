-- Add MVP Prize to tournaments
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS mvp_prize text;

-- Create Prize Pool Distribution table
CREATE TABLE IF NOT EXISTS public.tournament_prizepool_distribution (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
    place text NOT NULL, -- e.g. "1st", "2nd", "3rd-4th"
    prize text NOT NULL, -- e.g. "50,000 PKR"
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.tournament_prizepool_distribution ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Public can view prize pool distribution" 
ON public.tournament_prizepool_distribution FOR SELECT 
USING (true);

-- Allow admins to manage (assuming admin logic handles auth, but basic policy here)
-- We'll use the same logic as tournaments: authenticated updates if role is admin?
-- For simplicity in this project context where users are admins via role check in app:
CREATE POLICY "Admins can manage prize pool distribution"
ON public.tournament_prizepool_distribution FOR ALL
USING (
  auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'moderator'))
);
