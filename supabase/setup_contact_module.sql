-- Create a table for contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Policies for contact_requests
-- Anyone can insert (public contact form)
CREATE POLICY "Anyone can submit contact requests" ON public.contact_requests
    FOR INSERT WITH CHECK (true);

-- Only admins can view requests
CREATE POLICY "Admins can view contact requests" ON public.contact_requests
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Only admins can update status (e.g. mark as read)
CREATE POLICY "Admins can update contact requests" ON public.contact_requests
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Only admins can delete requests
CREATE POLICY "Admins can delete contact requests" ON public.contact_requests
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Insert initial content for Contact page if it doesn't exist
INSERT INTO public.content_pages (page_name, content)
VALUES (
    'contact',
    '{
        "email": "aiverse@vishnu.edu.in",
        "phone": "+91 9988776655",
        "address": "Department of CSE - AI & DS, Vishnu Institute of Technology",
        "social": {
            "instagram": "https://instagram.com/aiverse",
            "linkedin": "https://linkedin.com/company/aiverse"
        }
    }'::jsonb
)
ON CONFLICT (page_name) DO NOTHING;
