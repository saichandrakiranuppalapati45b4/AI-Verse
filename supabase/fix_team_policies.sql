-- Fix RLS policies for team_members table
DROP POLICY IF EXISTS "Admin can manage team members" ON public.team_members;

CREATE POLICY "Admins can manage team members" ON public.team_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Fix RLS policies for team-photos storage bucket
-- Drop existing specific policies if they rely on the hardcoded email
DROP POLICY IF EXISTS "Admin can upload team photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update team photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete team photos" ON storage.objects;

-- Re-create generic admin policies for team-photos
CREATE POLICY "Admins can upload team photos"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'team-photos' 
        AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can update team photos"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'team-photos' 
        AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can delete team photos"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'team-photos' 
        AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
