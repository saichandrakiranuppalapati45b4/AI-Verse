-- Fix missing profile for ukiranvarma@gmail.com
-- This typically happens if the user was created but the trigger failed.

INSERT INTO public.users (id, email, full_name, role)
VALUES (
    '5fbc003c-cf70-4625-b1ce-22c7ee7c79f3',
    'ukiranvarma@gmail.com',
    'U Kiran Varma',
    'jury'
)
ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    role = 'jury';
