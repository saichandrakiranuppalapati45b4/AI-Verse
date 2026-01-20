-- 1. Create the bucket if it doesn't exist (using ON CONFLICT DO NOTHING)
insert into storage.buckets (id, name, public)
values ('event-banners', 'event-banners', true)
on conflict (id) do nothing;

-- 2. Drop existing policies to ensure we can recreate them without errors
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Authenticated users can update" on storage.objects;
drop policy if exists "Authenticated users can delete" on storage.objects;

-- 3. Re-create the policies
-- Allow public read access to everyone
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'event-banners' );

-- Allow authenticated users to upload images
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check ( bucket_id = 'event-banners' and auth.role() = 'authenticated' );

-- Allow authenticated users to update their own uploads
create policy "Authenticated users can update"
  on storage.objects for update
  using ( bucket_id = 'event-banners' and auth.role() = 'authenticated' );

-- Allow authenticated users to delete images
create policy "Authenticated users can delete"
  on storage.objects for delete
  using ( bucket_id = 'event-banners' and auth.role() = 'authenticated' );
