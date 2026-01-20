-- Add registration_start_date to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS registration_start_date TIMESTAMP WITH TIME ZONE;
