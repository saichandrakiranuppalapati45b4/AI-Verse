-- Create a table to track sent reminders to avoid duplicates
CREATE TABLE IF NOT EXISTS public.reminder_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('5_days', '3_days', '1_day')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  UNIQUE(event_id, reminder_type)
);

-- Enable RLS
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage logs
CREATE POLICY "Admins can view reminder logs" ON public.reminder_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins (and service role) can insert reminder logs" ON public.reminder_logs
  FOR INSERT WITH CHECK (true);
