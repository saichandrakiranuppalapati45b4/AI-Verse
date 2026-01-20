-- Fix infinite recursion in the users table policies
-- The users table policies are causing circular dependencies

-- First, let's see what policies exist on users
-- Run this to check: SELECT * FROM pg_policies WHERE tablename = 'users';

-- Drop ALL existing policies on users table to eliminate recursion
drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Public profiles viewable by everyone" on public.users;
drop policy if exists "Enable read access for all users" on public.users;
drop policy if exists "Admins can manage users" on public.users;

-- Disable RLS on users table temporarily to allow operations
alter table public.users disable row level security;

-- OR if you want to keep RLS enabled, create simple non-recursive policies:
-- Re-enable RLS first
alter table public.users enable row level security;

-- Simple policy: Users can read their own profile (no subqueries)
create policy "Users read own profile"
  on public.users
  for select
  using ( id = auth.uid() );

-- Simple policy: Users can update their own profile (no subqueries)
create policy "Users update own profile"
  on public.users
  for update
  using ( id = auth.uid() );

-- Allow INSERT for new user registration (adjust as needed)
create policy "Users can insert own profile"
  on public.users
  for insert
  with check ( id = auth.uid() );
