-- Create avatars bucket if not exists (explicitly public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Admin can all avatars" ON storage.objects;

-- Policy 1: Everyone can view avatars
CREATE POLICY "Public can view avatars"
    ON storage.objects
    FOR SELECT
    USING ( bucket_id = 'avatars' );

-- Policy 2: Authenticated users can upload (insert)
CREATE POLICY "Users can upload avatars"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
    );

-- Policy 3: Authenticated users can update
CREATE POLICY "Users can update avatars"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
    );

-- Policy 4: Super Admin bypass (Explicit permission for your email)
CREATE POLICY "Admin can all avatars"
    ON storage.objects
    FOR ALL
    USING (
        bucket_id = 'avatars' 
        AND auth.jwt() ->> 'email' = '24pa1a45b4@vishnu.edu.in'
    );
