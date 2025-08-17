-- Ensure bucket exists
insert into storage.buckets (id, name, public)
values ('assignment-submissions', 'assignment-submissions', false)
on conflict (id) do nothing;

-- Drop existing policies to avoid duplicates
drop policy if exists "Students can upload assignment files" on storage.objects;
drop policy if exists "Students can view their own uploaded files" on storage.objects;
drop policy if exists "Teachers can view assignment files from their students" on storage.objects;
drop policy if exists "Students can delete their own uploaded files" on storage.objects;
drop policy if exists "Students can update their own uploaded files" on storage.objects;

-- Students can upload only to their own folder (first segment == their profile id)
create policy "Students can upload assignment files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'assignment-submissions'
    and (storage.foldername(name))[1] in (
      select p.id::text from public.profiles p
      where p.user_id = auth.uid() and p.role = 'student'
    )
  );

-- Students can view their own uploaded files
create policy "Students can view their own uploaded files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'assignment-submissions'
    and (storage.foldername(name))[1] in (
      select p.id::text from public.profiles p
      where p.user_id = auth.uid() and p.role = 'student'
    )
  );

-- Teachers and principals can view students' files they are allowed to see
create policy "Teachers can view assignment files from their students"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'assignment-submissions' and (
      -- Teacher of the class the student is enrolled in
      (storage.foldername(name))[1] in (
        select se.student_id::text
        from public.student_enrollments se
        join public.classes c on c.id = se.class_id
        join public.profiles tp on tp.id = c.teacher_id
        where tp.user_id = auth.uid() and tp.role = 'teacher'
      )
      or
      -- Principals can view all
      exists (
        select 1 from public.profiles pr
        where pr.user_id = auth.uid() and pr.role = 'principal'
      )
    )
  );

-- Students can update their own files (e.g., replace)
create policy "Students can update their own uploaded files"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'assignment-submissions'
    and (storage.foldername(name))[1] in (
      select p.id::text from public.profiles p
      where p.user_id = auth.uid() and p.role = 'student'
    )
  )
  with check (
    bucket_id = 'assignment-submissions'
    and (storage.foldername(name))[1] in (
      select p.id::text from public.profiles p
      where p.user_id = auth.uid() and p.role = 'student'
    )
  );

-- Students can delete their own files
create policy "Students can delete their own uploaded files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'assignment-submissions'
    and (storage.foldername(name))[1] in (
      select p.id::text from public.profiles p
      where p.user_id = auth.uid() and p.role = 'student'
    )
  );