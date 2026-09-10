-- =============================================================
-- LearnPulse — ACID Integrity & Database Reset
-- Apply this migration in Supabase SQL Editor
-- =============================================================

-- ─── 1. Strict Check Constraints on Mastery ───────────────────
-- Enforce domain-level consistency invariants
alter table mastery
  drop constraint if exists chk_mastery_attempts,
  drop constraint if exists chk_mastery_correct,
  drop constraint if exists chk_mastery_score_bounds;

alter table mastery
  add constraint chk_mastery_attempts check (attempts_count >= 0),
  add constraint chk_mastery_correct check (correct_count >= 0 and correct_count <= attempts_count),
  add constraint chk_mastery_score_bounds check (score >= 0 and score <= 100);

-- Ensure unique constraint on (user_id, concept_id) for atomic upsert locking
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'mastery_user_id_concept_id_key'
  ) then
    alter table mastery add constraint mastery_user_id_concept_id_key unique (user_id, concept_id);
  end if;
end $$;

-- ─── 2. Atomic Attempt Submission Procedure (ACID) ────────────
-- Atomicity: Attempt insertion, question banking aggregation, scaled score computation,
--            and mastery upsert execute in a single atomic transaction block.
-- Consistency: Invariants and constraints enforced at database engine level.
-- Isolation: Row-level lock (FOR UPDATE) acquired on the user's mastery row.
-- Durability: Commits to PostgreSQL WAL before returning to caller.
create or replace function submit_attempt_atomic(
  p_user_id uuid,
  p_question_id uuid,
  p_selected_answer text,
  p_concept_id uuid
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_question record;
  v_is_correct boolean;
  v_attempt_id uuid;
  v_total_concept_questions int;
  v_total_attempts int;
  v_total_correct int;
  v_unique_correct int;
  v_coverage numeric;
  v_accuracy numeric;
  v_scaled_score numeric;
  v_previous_score numeric := 0;
  v_now timestamptz := clock_timestamp();
begin
  -- 1. Validate caller identity (RLS verification inside security definer)
  if auth.uid() is not null and auth.uid() != p_user_id then
    raise exception 'Unauthorized: Cannot submit attempt for another user';
  end if;

  -- 2. Fetch and validate question (server-side verification of correct answer)
  select id, correct_answer, concept_id, difficulty
  into v_question
  from questions
  where id = p_question_id;

  if not found then
    raise exception 'Question not found with ID: %', p_question_id;
  end if;

  -- Verify question belongs to target concept
  if v_question.concept_id != p_concept_id then
    raise exception 'Concept mismatch: question belongs to %, requested %', v_question.concept_id, p_concept_id;
  end if;

  v_is_correct := (trim(p_selected_answer) = trim(v_question.correct_answer));

  -- 3. Atomically insert attempt record
  insert into attempts (user_id, question_id, selected_answer, is_correct, created_at)
  values (p_user_id, p_question_id, p_selected_answer, v_is_correct, v_now)
  returning id into v_attempt_id;

  -- 4. Count total available questions for this concept (bank size)
  select count(*)
  into v_total_concept_questions
  from questions
  where concept_id = p_concept_id;

  if v_total_concept_questions <= 0 then
    v_total_concept_questions := 1;
  end if;

  -- 5. Calculate cumulative stats across all attempts by this user for this concept
  select
    count(*),
    count(*) filter (where a.is_correct = true),
    count(distinct a.question_id) filter (where a.is_correct = true)
  into
    v_total_attempts,
    v_total_correct,
    v_unique_correct
  from attempts a
  join questions q on q.id = a.question_id
  where a.user_id = p_user_id
    and q.concept_id = p_concept_id;

  -- 6. Acquire row-level lock on mastery record if it exists (Isolation guarantee)
  select score into v_previous_score
  from mastery
  where user_id = p_user_id and concept_id = p_concept_id
  for update;

  if not found then
    v_previous_score := 0;
  end if;

  -- 7. Compute deterministic scaled mastery formula:
  -- Base coverage = 80 points * (uniqueCorrect / totalQuestions)
  -- Accuracy bonus = 20 points * (uniqueCorrect / totalQuestions) * (totalCorrect / totalAttempts)
  if v_total_concept_questions <= 0 or v_unique_correct <= 0 or v_total_attempts <= 0 then
    v_scaled_score := 0;
  else
    v_coverage := least(1.0, greatest(0.0, v_unique_correct::numeric / v_total_concept_questions::numeric));
    v_accuracy := least(1.0, greatest(0.0, v_total_correct::numeric / v_total_attempts::numeric));
    v_scaled_score := round((80.0 * v_coverage) + (20.0 * v_coverage * v_accuracy));
    v_scaled_score := least(100.0, greatest(0.0, v_scaled_score));
  end if;

  -- 8. Atomically upsert mastery
  insert into mastery (user_id, concept_id, score, attempts_count, correct_count, updated_at)
  values (p_user_id, p_concept_id, v_scaled_score, v_total_attempts, v_total_correct, v_now)
  on conflict (user_id, concept_id) do update set
    score = excluded.score,
    attempts_count = excluded.attempts_count,
    correct_count = excluded.correct_count,
    updated_at = excluded.updated_at;

  -- 9. Return structured atomic result
  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'is_correct', v_is_correct,
    'correct_answer', v_question.correct_answer,
    'previous_score', v_previous_score,
    'new_score', v_scaled_score,
    'total_attempts', v_total_attempts,
    'total_correct', v_total_correct,
    'unique_questions_correct', v_unique_correct,
    'total_concept_questions', v_total_concept_questions,
    'updated_at', v_now
  );
end;
$$;

-- Grant execution to authenticated users
grant execute on function submit_attempt_atomic(uuid, uuid, text, uuid) to authenticated;
grant execute on function submit_attempt_atomic(uuid, uuid, text, uuid) to service_role;

-- ─── 3. Clean Reset of Seed Attempt & Mastery Data ────────────
-- Clears out old uncalibrated attempt data causing cross-course metric bleed
truncate table attempts cascade;
truncate table mastery cascade;
truncate table interventions cascade;
