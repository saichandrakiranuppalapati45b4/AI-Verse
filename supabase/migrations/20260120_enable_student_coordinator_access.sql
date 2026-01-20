-- Migration: Enable Student Coordinator Access via RLS

-- 1. REGISTRATIONS: Allow Student Coordinators to VIEW all registrations
CREATE POLICY "Student Coordinators can view all registrations" ON public.registrations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'student_coordinator')
  );

-- 2. REGISTRATIONS: Allow Student Coordinators to UPDATE (approve, check-in)
CREATE POLICY "Student Coordinators can update registrations" ON public.registrations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'student_coordinator')
  );

-- 3. ATTENDANCE LOGS: Allow Student Coordinators to VIEW logs
CREATE POLICY "Student Coordinators can view attendance logs" ON public.attendance_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'student_coordinator')
  );

-- 4. ATTENDANCE LOGS: Allow Student Coordinators to INSERT logs (check-in)
CREATE POLICY "Student Coordinators can insert attendance logs" ON public.attendance_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'student_coordinator')
  );

-- 5. EVENTS: Allow Student Coordinators to VIEW all events (even unpublished, to manage them)
-- Note: 'Admins can manage all events' handles admins. We need a select for coordinators.
CREATE POLICY "Student Coordinators can view all events" ON public.events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'student_coordinator')
  );
