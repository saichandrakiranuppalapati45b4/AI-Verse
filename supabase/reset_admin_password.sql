-- Reset Admin Password
-- This script updates the password for the specified admin email
-- Password will be set to: Admin@123

-- Ensure pgcrypto extension is available for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    target_email TEXT := '24pa1a45b4@vishnu.edu.in';
    new_password TEXT := 'Admin@123';
BEGIN
    -- Update the password in auth.users
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = now(),
        email_confirmed_at = COALESCE(email_confirmed_at, now()) -- Ensure email is confirmed
    WHERE email = target_email;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'User with email % not found in auth.users', target_email;
    ELSE
        RAISE NOTICE 'Password updated successfully for %', target_email;
    END IF;
END $$;
