-- Add max score columns to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS max_score_innovation INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS max_score_feasibility INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS max_score_statistics INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS max_score_revenue INTEGER DEFAULT 10;
