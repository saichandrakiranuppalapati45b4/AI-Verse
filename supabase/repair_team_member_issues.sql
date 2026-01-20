-- 1. Ensure columns exist
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS position TEXT;

-- 2. Fix Team Members RLS (Allow all admins)
DROP POLICY IF EXISTS "Admin can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;

CREATE POLICY "Admins can manage team members" ON public.team_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Fix Storage RLS for team-photos
DROP POLICY IF EXISTS "Admin can upload team photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update team photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete team photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload team photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update team photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete team photos" ON storage.objects;

CREATE POLICY "Admins can upload team photos"
    ON storage.objects FOR INSERT WITH CHECK (
        bucket_id = 'team-photos' 
        AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can update team photos"
    ON storage.objects FOR UPDATE USING (
        bucket_id = 'team-photos' 
        AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can delete team photos"
    ON storage.objects FOR DELETE USING (
        bucket_id = 'team-photos' 
        AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
