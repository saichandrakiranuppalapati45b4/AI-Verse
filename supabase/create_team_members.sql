-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    image_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public request can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Admin can manage team members" ON public.team_members;

-- Create policies
CREATE POLICY "Public request can view team members"
    ON public.team_members
    FOR SELECT
    USING (true);

CREATE POLICY "Admin can manage team members"
    ON public.team_members
    FOR ALL
    USING (
         auth.jwt() ->> 'email' = '24pa1a45b4@vishnu.edu.in'
    );

-- Create bucket for team photos if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('team-photos', 'team-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if any (although storage policies are complex to check existence simply, we can attempt recreation or ignore error if simple)
-- Better approach for storage policies in raw SQL without procedural code is tricky for "DROP IF EXISTS", 
-- but we can try to drop them by name if we know them.
DROP POLICY IF EXISTS "Public can view team photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload team photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update team photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete team photos" ON storage.objects;

-- Storage policies
CREATE POLICY "Public can view team photos"
    ON storage.objects
    FOR SELECT
    USING ( bucket_id = 'team-photos' );

CREATE POLICY "Admin can upload team photos"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'team-photos' 
        AND auth.jwt() ->> 'email' = '24pa1a45b4@vishnu.edu.in'
    );

CREATE POLICY "Admin can update team photos"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'team-photos' 
        AND auth.jwt() ->> 'email' = '24pa1a45b4@vishnu.edu.in'
    );

CREATE POLICY "Admin can delete team photos"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'team-photos' 
        AND auth.jwt() ->> 'email' = '24pa1a45b4@vishnu.edu.in'
    );
