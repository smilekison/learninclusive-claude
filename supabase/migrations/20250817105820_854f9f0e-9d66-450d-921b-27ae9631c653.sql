-- Ensure bucket exists
insert into storage.buckets (id, name, public)
values ('assignment-submissions','assignment-submissions', false)
on conflict (id) do nothing;

-- Policy: allow authenticated users to upload to their own folder (auth.uid as top-level folder)
drop policy if exists "Users can INSERT into their own folder - assignment-submissions" on storage.objects;
create policy "Users can INSERT into their own folder - assignment-submissions"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'assignment-submissions'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Policy: allow authenticated users to SELECT their own files
drop policy if exists "Users can SELECT their own files - assignment-submissions" on storage.objects;
create policy "Users can SELECT their own files - assignment-submissions"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'assignment-submissions'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Policy: allow authenticated users to UPDATE their own files
drop policy if exists "Users can UPDATE their own files - assignment-submissions" on storage.objects;
create policy "Users can UPDATE their own files - assignment-submissions"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'assignment-submissions'
    and (auth.uid())::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'assignment-submissions'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Policy: allow authenticated users to DELETE their own files
drop policy if exists "Users can DELETE their own files - assignment-submissions" on storage.objects;
create policy "Users can DELETE their own files - assignment-submissions"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'assignment-submissions'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );