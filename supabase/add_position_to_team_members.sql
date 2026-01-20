-- Add position column to team_members
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS position TEXT;

-- Optional: Backfill existing records (if any) to have a default position if needed
-- UPDATE public.team_members SET position = 'Member' WHERE position IS NULL;
