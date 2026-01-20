-- Enable RLS on users table (if not already enabled, though best practice is enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop potential conflicting policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Public can view basic user info" ON public.users;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON public.users
    FOR SELECT
    USING ( auth.uid() = id );

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.users
    FOR UPDATE
    USING ( auth.uid() = id )
    WITH CHECK ( auth.uid() = id );

-- Policy 3: Allow viewing basic info of others if needed (e.g. for team pages if users table linked)
-- Or just allow admin full access
CREATE POLICY "Admins can do everything on users"
    ON public.users
    FOR ALL
    USING (
        auth.jwt() ->> 'email' = '24pa1a45b4@vishnu.edu.in'
    );
