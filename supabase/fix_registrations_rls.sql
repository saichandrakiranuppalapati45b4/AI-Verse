-- Fix RLS policies for registrations table to allow admin updates

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin can manage registrations" ON public.registrations;
DROP POLICY IF EXISTS "Public can create registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can view their registrations" ON public.registrations;

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Admin can do everything with registrations
CREATE POLICY "Admin can manage registrations"
  ON public.registrations
  FOR ALL
  USING (
    auth.jwt() ->> 'email' = '24pa1a45b4@vishnu.edu.in'
  );

-- Anyone can create registrations (public registration)
CREATE POLICY "Public can create registrations"
  ON public.registrations
  FOR INSERT
  WITH CHECK (true);

-- Users can view all registrations (for public event pages)
CREATE POLICY "Public can view registrations"
  ON public.registrations
  FOR SELECT
  USING (true);
