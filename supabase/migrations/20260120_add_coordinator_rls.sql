-- Allow Student Coordinators to VIEW registrations
CREATE POLICY "Coordinators can view all registrations"
ON public.registrations
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'student_coordinator'
  )
);

-- Allow Student Coordinators to UPDATE registrations (check-in)
CREATE POLICY "Coordinators can update registrations"
ON public.registrations
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'student_coordinator'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'student_coordinator'
  )
);

-- Allow Student Coordinators to INSERT attendance logs
CREATE POLICY "Coordinators can maximize attendance logs"
ON public.attendance_logs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'student_coordinator'
  )
);

-- Allow Student Coordinators to VIEW attendance logs
CREATE POLICY "Coordinators can view attendance logs"
ON public.attendance_logs
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'student_coordinator'
  )
);
