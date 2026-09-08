-- =============================================================
-- FIX: Break Infinite Recursion in Row Level Security (RLS)
-- Run this script in Supabase Dashboard → SQL Editor
-- =============================================================

-- Drop policies causing recursive loops across courses <-> attempts <-> questions
drop policy if exists "courses: teachers manage own" on courses;
drop policy if exists "courses: students read courses with their attempts" on courses;
drop policy if exists "concepts: teachers manage via course" on concepts;
drop policy if exists "concepts: students read from their courses" on concepts;
drop policy if exists "concept_edges: teachers manage" on concept_edges;
drop policy if exists "concept_edges: students read" on concept_edges;
drop policy if exists "questions: teachers manage" on questions;
drop policy if exists "questions: students read" on questions;
drop policy if exists "attempts: teachers read for their courses" on attempts;
drop policy if exists "mastery: teachers read for their courses" on mastery;
drop policy if exists "profiles: teachers read student profiles" on profiles;
drop policy if exists "interventions: teachers read for their courses" on interventions;

-- ─── 1. COURSES ───────────────────────────────────────────────
-- Teachers can manage their own courses
create policy "courses: teachers manage own"
  on courses for all
  using (teacher_id = auth.uid());

-- All authenticated users can view courses
create policy "courses: authenticated read"
  on courses for select
  using (auth.role() = 'authenticated');

-- ─── 2. CONCEPTS & EDGES ─────────────────────────────────────
-- Curriculum is readable by all authenticated users
create policy "concepts: authenticated read"
  on concepts for select
  using (auth.role() = 'authenticated');

create policy "concepts: teachers manage via course"
  on concepts for all
  using (
    exists (
      select 1 from courses c
      where c.id = concepts.course_id and c.teacher_id = auth.uid()
    )
  );

create policy "concept_edges: authenticated read"
  on concept_edges for select
  using (auth.role() = 'authenticated');

create policy "concept_edges: teachers manage"
  on concept_edges for all
  using (
    exists (
      select 1 from courses c
      where c.id = concept_edges.course_id and c.teacher_id = auth.uid()
    )
  );

-- ─── 3. QUESTIONS ─────────────────────────────────────────────
-- Questions readable by authenticated users (answers protected at app layer)
create policy "questions: authenticated read"
  on questions for select
  using (auth.role() = 'authenticated');

create policy "questions: teachers manage"
  on questions for all
  using (
    exists (
      select 1 from courses c
      where c.id = questions.course_id and c.teacher_id = auth.uid()
    )
  );

-- ─── 4. PROFILES ──────────────────────────────────────────────
-- Teachers can view all profiles; users can view their own
create policy "profiles: teachers read all"
  on profiles for select
  using (get_my_role() = 'teacher');

-- ─── 5. ATTEMPTS & MASTERY & INTERVENTIONS ────────────────────
-- Teachers can view student records across their courses without recursion
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
