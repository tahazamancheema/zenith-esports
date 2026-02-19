-- Add mvp_prize column to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS mvp_prize TEXT;
