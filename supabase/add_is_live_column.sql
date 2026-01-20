-- Add is_live column to events table for controlling live status
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;

-- Create index for faster queries on live events
CREATE INDEX IF NOT EXISTS idx_events_is_live ON public.events(is_live);
