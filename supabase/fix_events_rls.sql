-- Fix infinite recursion by simplifying the events RLS policy
-- This removes the subquery to the users table which was causing the circular dependency

-- Drop the problematic policy
drop policy if exists "Admins can manage events" on public.events;
drop policy if exists "Public view events" on public.events;

-- Create a simplified policy that ONLY checks the JWT email
-- This avoids querying the users table and eliminates infinite recursion
create policy "Admins can manage events"
  on public.events
  for all
  using (
    auth.jwt() ->> 'email' = '24pa1a45b4@vishnu.edu.in'
  );

-- Allow public to view published events
create policy "Public view events"
  on public.events
  for select
  using ( is_published = true or auth.jwt() ->> 'email' = '24pa1a45b4@vishnu.edu.in' );
