-- Add checked_in column to registrations table
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE;
