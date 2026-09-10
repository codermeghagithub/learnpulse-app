-- =============================================================
-- LearnPulse Migration: Student Course Enrollments
-- Apply this script in Supabase Dashboard → SQL Editor
-- =============================================================

create table if not exists enrollments (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  course_id   uuid not null references courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- Performance indexes for quick roster and student lookups
create index if not exists idx_enrollments_user_id on enrollments(user_id);
create index if not exists idx_enrollments_course_id on enrollments(course_id);

-- Row Level Security
alter table enrollments enable row level security;

-- Policies
drop policy if exists "enrollments: students read own" on enrollments;
drop policy if exists "enrollments: students insert own" on enrollments;
drop policy if exists "enrollments: students delete own" on enrollments;
drop policy if exists "enrollments: teachers read for their courses" on enrollments;
drop policy if exists "enrollments: authenticated read" on enrollments;

create policy "enrollments: students read own"
  on enrollments for select
  using (user_id = auth.uid());

create policy "enrollments: students insert own"
  on enrollments for insert
  with check (user_id = auth.uid());

create policy "enrollments: students delete own"
  on enrollments for delete
  using (user_id = auth.uid());

create policy "enrollments: teachers read for their courses"
  on enrollments for select
  using (
    get_my_role() = 'teacher'
    and exists (
      select 1 from courses c
      where c.id = enrollments.course_id
        and c.teacher_id = auth.uid()
    )
  );

-- Service role bypass for server actions / admin
create policy "enrollments: service role full access"
  on enrollments for all
  using (auth.role() = 'service_role');
