
-- 1) Helper functions to break RLS recursion
-- Return current user's profile id
create or replace function public.get_current_profile_id()
returns uuid
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select id from public.profiles where user_id = auth.uid();
$$;

-- Is a class taught by the current teacher?
create or replace function public.is_class_taught_by_current_teacher(p_class_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  with me as (
    select id as teacher_profile_id
    from public.profiles
    where user_id = auth.uid()
  )
  select exists (
    select 1
    from public.classes c
    join me on true
    where c.id = p_class_id
      and c.teacher_id = me.teacher_profile_id
  );
$$;

-- Is the current student enrolled in a class?
create or replace function public.is_current_student_enrolled_in_class(p_class_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  with me as (
    select id as student_profile_id
    from public.profiles
    where user_id = auth.uid()
  )
  select exists (
    select 1
    from public.student_enrollments se
    join me on true
    where se.class_id = p_class_id
      and se.student_id = me.student_profile_id
  );
$$;

-- Is the current teacher the teacher of the given student?
create or replace function public.is_teacher_of_student(p_student_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  with me as (
    select id as teacher_profile_id
    from public.profiles
    where user_id = auth.uid()
  )
  select exists (
    select 1
    from public.student_enrollments se
    join public.classes c on c.id = se.class_id
    join me on true
    where se.student_id = p_student_id
      and c.teacher_id = me.teacher_profile_id
  );
$$;

-- 2) Replace problematic policies with function-based ones

-- profiles: replace teacher view policy to avoid cross-table subqueries in-policy
drop policy if exists "Teachers can view their students' profiles" on public.profiles;
create policy "Teachers can view their students' profiles"
on public.profiles
for select
using (
  is_active = true
  and public.is_teacher_of_student(id)
);

-- student_enrollments: avoid subselects to profiles/classes inside policy
drop policy if exists "Students can view their own enrollments" on public.student_enrollments;
create policy "Students can view their own enrollments"
on public.student_enrollments
for select
using (
  student_id = public.get_current_profile_id()
);

drop policy if exists "Teachers can view enrollments for their classes" on public.student_enrollments;
create policy "Teachers can view enrollments for their classes"
on public.student_enrollments
for select
using (
  public.is_class_taught_by_current_teacher(class_id)
);

-- classes: use helper to avoid subqueries to student_enrollments + profiles
drop policy if exists "Students can view their enrolled classes" on public.classes;
create policy "Students can view their enrolled classes"
on public.classes
for select
using (
  is_active = true
  and public.is_current_student_enrolled_in_class(classes.id)
);

-- subjects: use the same helper based on class_id
drop policy if exists "Students can view subjects in their enrolled classes" on public.subjects;
create policy "Students can view subjects in their enrolled classes"
on public.subjects
for select
using (
  is_active = true
  and public.is_current_student_enrolled_in_class(subjects.class_id)
);
