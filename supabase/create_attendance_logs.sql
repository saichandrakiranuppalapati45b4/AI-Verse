-- Create attendance_logs table for tracking detailed check-ins
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    session TEXT NOT NULL CHECK (session IN ('Morning', 'Afternoon')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(registration_id, check_in_date, session)
);

-- Add RLS policies
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage attendance logs"
    ON public.attendance_logs
    FOR ALL
    USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'))
    WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));
