-- 1. Nuke ALL existing policies on the users table to clear recursion
DO $$ 
DECLARE 
    pol record; 
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname); 
    END LOOP; 
END $$;

-- 2. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create CLEAN, NON-RECURSIVE policies

-- Policy: Users can view/edit THEIR OWN profile (using auth.uid() which is safe)
CREATE POLICY "Users can manage own profile"
    ON public.users
    FOR ALL
    USING ( auth.uid() = id )
    WITH CHECK ( auth.uid() = id );

-- Policy: Allow PUBLIC read access (needed for Team page names/avatars)
-- This avoids querying "is_admin" column on the table itself
CREATE POLICY "Public read all users"
    ON public.users
    FOR SELECT
    USING (true);

-- Policy: Super Admin Bypass (using JWT email, NOT table lookup)
CREATE POLICY "Super Admin Bypass"
    ON public.users
    FOR ALL
    USING (
         auth.jwt() ->> 'email' = '24pa1a45b4@vishnu.edu.in'
    );
