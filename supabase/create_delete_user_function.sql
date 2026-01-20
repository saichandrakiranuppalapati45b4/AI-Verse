-- Function to allow Super Admin to delete users
-- This deletes from auth.users, which should CASCADE to public.users if set up correctly
-- Or we delete both manually to be safe.

CREATE OR REPLACE FUNCTION delete_user_by_id(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
SET search_path = public
AS $$
BEGIN
    -- Check if the executor is the Super Admin
    -- We use the email from the JWT to verify the caller
    IF auth.jwt() ->> 'email' <> '24pa1a45b4@vishnu.edu.in' THEN
        RAISE EXCEPTION 'Unauthorized: Only Super Admin can delete users';
    END IF;

    -- Delete from auth.users (this requires superuser/service_role privs causing SECURITY DEFINER to be needed)
    -- But standard postgres users can't delete from auth.users usually unless they are superusers.
    -- Supabase functions run as the db owner usually, which has rights.
    
    DELETE FROM auth.users WHERE id = target_user_id;
    
    -- public.users should be deleted by cascade, but if not:
    DELETE FROM public.users WHERE id = target_user_id;
END;
$$;
