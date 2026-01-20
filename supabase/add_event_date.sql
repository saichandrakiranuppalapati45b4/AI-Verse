-- Add event_date column to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ;

-- Update existing events to use start_date as event_date if event_date is null
UPDATE public.events
SET event_date = start_date
WHERE event_date IS NULL;
