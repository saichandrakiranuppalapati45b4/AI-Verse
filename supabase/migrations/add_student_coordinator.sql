
-- Drop the existing role check constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new check constraint including 'student_coordinator'
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'jury', 'public', 'student_coordinator'));

-- Add Policy for Student Coordinators to SELECT registrations
-- They need to see all registrations to manage check-ins or view details
CREATE POLICY "Student Coordinators can view all registrations" ON public.registrations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'student_coordinator')
  );

-- Add Policy for Student Coordinators to SELECT events
-- Needed to filter registrations by event
CREATE POLICY "Student Coordinators can view all events" ON public.events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'student_coordinator')
  );

-- Add Policy for Student Coordinators to SELECT their own user profile
-- Already covered by "Users can view their own profile" but good to verify
-- "Users can view their own profile" covers FOR SELECT USING (auth.uid() = id);

-- If they need to mark check-ins (UPDATE), we might need this:
-- For now, let's assume Read-Only as requested ("see the registrations").
-- If they need to check in, we'll need an UPDATE policy.
-- Given "Student Coordinator", check-in is highly likely.
-- Adding limited UPDATE policy for check-in status if needed later, but sticking to SELECT for now per specific request.
