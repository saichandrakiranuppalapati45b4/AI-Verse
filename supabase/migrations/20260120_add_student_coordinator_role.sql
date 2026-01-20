-- Migration: Add student_coordinator to allowed roles

-- 1. Drop the existing check constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Add the new check constraint including 'student_coordinator'
ALTER TABLE public.users
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'jury', 'public', 'student_coordinator'));
