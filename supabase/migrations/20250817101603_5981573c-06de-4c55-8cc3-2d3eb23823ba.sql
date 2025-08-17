-- Ensure the private bucket exists
insert into storage.buckets (id, name, public)
values ('assignment-submissions', 'assignment-submissions', false)
on conflict (id) do nothing;

-- Storage RLS policies for assignment submissions
-- Remove existing policies with same names to avoid duplicates
drop policy if exists "Students can upload assignment files" on storage.objects;
drop policy if exists "Students can view their own uploaded files" on storage.objects;
drop policy if exists "Teachers can view assignment files from their students" on storage.objects;

-- Allow authenticated students to upload only to their own folder (first path segment = their profile id)
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

-- Teachers (and principals) can view files of students they teach
create policy "Teachers can view assignment files from their students"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'assignment-submissions' and (
      (storage.foldername(name))[1] in (
        select se.student_id::text
        from public.student_enrollments se
        join public.classes c on se.class_id = c.id
        join public.profiles p on c.teacher_id = p.id
        where p.user_id = auth.uid() and p.role = 'teacher'
      )
      or exists (
        select 1 from public.profiles p
        where p.user_id = auth.uid() and p.role = 'principal'
      )
    )
  );