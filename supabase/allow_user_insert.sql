-- Allow users to self-repair/insert their own profile if missing
-- This is critical for the "Auto-Fix Profile" button to work.

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
