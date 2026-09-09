-- =============================================================
-- LearnPulse — SIH 2026 MVP Database Schema
-- Apply this in your Supabase SQL editor in order.
-- =============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── profiles ─────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        text not null check (role in ('student', 'teacher')),
  created_at  timestamptz not null default now()
);

-- Automatically create a profile row when a new auth user signs up
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── courses ──────────────────────────────────────────────────
create table if not exists courses (
  id          uuid primary key default uuid_generate_v4(),
  teacher_id  uuid not null references profiles(id) on delete cascade,
  title       text not null,
  subject     text not null,
  created_at  timestamptz not null default now()
);

-- ─── concepts ─────────────────────────────────────────────────
create table if not exists concepts (
  id          uuid primary key default uuid_generate_v4(),
  course_id   uuid not null references courses(id) on delete cascade,
  name        text not null,
  description text,
  difficulty  text not null check (difficulty in ('easy', 'medium', 'hard')) default 'medium',
  created_at  timestamptz not null default now()
);

-- ─── concept_edges ────────────────────────────────────────────
-- prerequisite_id → concept_id (prereq must be mastered before concept)
create table if not exists concept_edges (
  id               uuid primary key default uuid_generate_v4(),
  course_id        uuid not null references courses(id) on delete cascade,
  prerequisite_id  uuid not null references concepts(id) on delete cascade,
  concept_id       uuid not null references concepts(id) on delete cascade,
  weight           numeric not null default 1,
  unique (prerequisite_id, concept_id)
);

-- ─── questions ────────────────────────────────────────────────
create table if not exists questions (
  id              uuid primary key default uuid_generate_v4(),
  course_id       uuid not null references courses(id) on delete cascade,
  concept_id      uuid not null references concepts(id) on delete cascade,
  question_text   text not null,
  options         jsonb not null,   -- [{ "key": "A", "text": "..." }, ...]
  correct_answer  text not null,    -- "A" | "B" | "C" | "D"
  explanation     text,
  difficulty      text not null check (difficulty in ('easy', 'medium', 'hard')) default 'medium',
  created_at      timestamptz not null default now()
);

-- ─── attempts ─────────────────────────────────────────────────
create table if not exists attempts (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references profiles(id) on delete cascade,
  question_id      uuid not null references questions(id) on delete cascade,
  selected_answer  text not null,
  is_correct       boolean not null,
  created_at       timestamptz not null default now()
);

-- ─── mastery ──────────────────────────────────────────────────
create table if not exists mastery (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles(id) on delete cascade,
  concept_id      uuid not null references concepts(id) on delete cascade,
  score           numeric not null default 0 check (score >= 0 and score <= 100),
  attempts_count  integer not null default 0,
  correct_count   integer not null default 0,
  updated_at      timestamptz not null default now(),
  unique (user_id, concept_id)
);

-- ─── interventions ────────────────────────────────────────────
create table if not exists interventions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references profiles(id) on delete cascade,
  concept_id          uuid not null references concepts(id) on delete cascade,
  root_cause          text not null,
  blocking_concept_id uuid references concepts(id),
  confidence          numeric not null default 0 check (confidence >= 0 and confidence <= 1),
  explanation         text not null,
  action_plan         jsonb not null default '[]'::jsonb,
  status              text not null check (status in ('pending', 'in_progress', 'resolved')) default 'pending',
  mastery_snapshot    numeric not null default 0,
  created_at          timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists idx_attempts_user_id on attempts(user_id);
create index if not exists idx_attempts_question_id on attempts(question_id);
create index if not exists idx_mastery_user_id on mastery(user_id);
create index if not exists idx_mastery_concept_id on mastery(concept_id);
create index if not exists idx_concept_edges_course_id on concept_edges(course_id);
create index if not exists idx_interventions_user_concept on interventions(user_id, concept_id);
create index if not exists idx_questions_concept_id on questions(concept_id);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

alter table profiles        enable row level security;
alter table courses         enable row level security;
alter table concepts        enable row level security;
alter table concept_edges   enable row level security;
alter table questions       enable row level security;
alter table attempts        enable row level security;
alter table mastery         enable row level security;
alter table interventions   enable row level security;

-- Helper: read role from profiles (never trust client-sent claims)
create or replace function get_my_role()
returns text
language sql
security definer
stable
as $$
  select role from profiles where id = auth.uid() limit 1;
$$;

-- Helper: check if a student is enrolled in a teacher's course
-- (via attempts or mastery referencing questions in teacher's courses)
create or replace function teacher_can_read_student(student uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from courses c
    where c.teacher_id = auth.uid()
      and exists (
        select 1
        from attempts a
        join questions q on q.id = a.question_id
        where a.user_id = student
          and q.course_id = c.id
      )
  );
$$;

-- ─── profiles ─────────────────────────────────────────────────
create policy "profiles: users read own"
  on profiles for select
  using (id = auth.uid());

create policy "profiles: users update own"
  on profiles for update
  using (id = auth.uid());

create policy "profiles: teachers read all"
  on profiles for select
  using (get_my_role() = 'teacher');

-- ─── courses ──────────────────────────────────────────────────
create policy "courses: teachers manage own"
  on courses for all
  using (teacher_id = auth.uid());

create policy "courses: authenticated read"
  on courses for select
  using (auth.role() = 'authenticated');

-- ─── concepts ─────────────────────────────────────────────────
create policy "concepts: teachers manage via course"
  on concepts for all
  using (
    exists (
      select 1 from courses c
      where c.id = concepts.course_id and c.teacher_id = auth.uid()
    )
  );

create policy "concepts: authenticated read"
  on concepts for select
  using (auth.role() = 'authenticated');

-- ─── concept_edges ────────────────────────────────────────────
create policy "concept_edges: teachers manage"
  on concept_edges for all
  using (
    exists (
      select 1 from courses c
      where c.id = concept_edges.course_id and c.teacher_id = auth.uid()
    )
  );

create policy "concept_edges: authenticated read"
  on concept_edges for select
  using (auth.role() = 'authenticated');

-- ─── questions ────────────────────────────────────────────────
create policy "questions: teachers manage"
  on questions for all
  using (
    exists (
      select 1 from courses c
      where c.id = questions.course_id and c.teacher_id = auth.uid()
    )
  );

create policy "questions: authenticated read"
  on questions for select
  using (auth.role() = 'authenticated');

-- ─── attempts ─────────────────────────────────────────────────
create policy "attempts: students read own"
  on attempts for select
  using (user_id = auth.uid());

create policy "attempts: students insert own"
  on attempts for insert
  with check (user_id = auth.uid());

create policy "attempts: teachers read for their courses"
  on attempts for select
  using (
    get_my_role() = 'teacher'
    and exists (
      select 1 from questions q
      join courses c on c.id = q.course_id
      where q.id = attempts.question_id
        and c.teacher_id = auth.uid()
    )
  );

-- ─── mastery ──────────────────────────────────────────────────
create policy "mastery: students read own"
  on mastery for select
  using (user_id = auth.uid());

create policy "mastery: students insert own"
  on mastery for insert
  with check (user_id = auth.uid());

create policy "mastery: students update own"
  on mastery for update
  using (user_id = auth.uid());

create policy "mastery: teachers read for their courses"
  on mastery for select
  using (
    get_my_role() = 'teacher'
    and exists (
      select 1 from concepts con
      join courses c on c.id = con.course_id
      where con.id = mastery.concept_id
        and c.teacher_id = auth.uid()
    )
  );

-- ─── interventions ────────────────────────────────────────────
create policy "interventions: students read own"
  on interventions for select
  using (user_id = auth.uid());

create policy "interventions: students insert own"
  on interventions for insert
  with check (user_id = auth.uid());

create policy "interventions: students update own"
  on interventions for update
  using (user_id = auth.uid());

create policy "interventions: teachers read for their courses"
  on interventions for select
  using (
    get_my_role() = 'teacher'
    and exists (
      select 1 from concepts con
      join courses c on c.id = con.course_id
      where con.id = interventions.concept_id
        and c.teacher_id = auth.uid()
    )
  );

-- ─── concept_bites ────────────────────────────────────────────
create table if not exists concept_bites (
  id                  uuid primary key default uuid_generate_v4(),
  concept_id          uuid not null references concepts(id) on delete cascade unique,
  intuition           text not null,
  analogy             text not null,
  quick_check         jsonb not null,
  vernacular_anchor   text,
  created_at          timestamptz not null default now()
);

create index if not exists idx_concept_bites_concept_id on concept_bites(concept_id);

alter table concept_bites enable row level security;

create policy "concept_bites: authenticated read"
  on concept_bites for select
  using (auth.role() = 'authenticated');

create policy "concept_bites: authenticated insert or update"
  on concept_bites for all
  using (auth.role() = 'authenticated');

