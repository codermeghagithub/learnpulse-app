#!/usr/bin/env node
/**
 * sync_mastery_scores.mjs
 *
 * Fast batch synchronization of all historical mastery records in PostgreSQL.
 */

import { createClient } from "@supabase/supabase-js";
import { computeScaledMastery } from "../src/lib/algorithms/mastery.ts";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE env vars.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log("\n🔄 Batch synchronizing all mastery scores with bank-aware scaled formula...\n");

  // 1. Fetch all concepts and questions
  const { data: concepts, error: cErr } = await supabase
    .from("concepts")
    .select("id, name, course_id");
  if (cErr) throw cErr;

  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("id, concept_id");
  if (qErr) throw qErr;

  const questionsByConcept = new Map();
  for (const q of questions || []) {
    if (!questionsByConcept.has(q.concept_id)) {
      questionsByConcept.set(q.concept_id, []);
    }
    questionsByConcept.get(q.concept_id).push(q.id);
  }

  // 2. Fetch all student profiles
  const { data: students, error: sErr } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("role", "student");
  if (sErr) throw sErr;

  // 3. Fetch all attempts
  const { data: attempts, error: aErr } = await supabase
    .from("attempts")
    .select("user_id, question_id, is_correct");
  if (aErr) throw aErr;

  const questionConceptMap = new Map((questions || []).map((q) => [q.id, q.concept_id]));

  const userConceptAttempts = new Map();
  for (const a of attempts || []) {
    const conceptId = questionConceptMap.get(a.question_id);
    if (!conceptId) continue;
    const key = `${a.user_id}::${conceptId}`;
    if (!userConceptAttempts.has(key)) {
      userConceptAttempts.set(key, {
        userId: a.user_id,
        conceptId,
        total: 0,
        correct: 0,
        uniqueCorrect: new Set(),
      });
    }
    const entry = userConceptAttempts.get(key);
    entry.total++;
    if (a.is_correct) {
      entry.correct++;
      entry.uniqueCorrect.add(a.question_id);
    }
  }

  const now = new Date().toISOString();
  const rowsToUpsert = [];

  for (const student of students || []) {
    for (const concept of concepts || []) {
      const conceptQuestions = questionsByConcept.get(concept.id) || [];
      const totalConceptQuestions = conceptQuestions.length;
      const key = `${student.id}::${concept.id}`;
      const entry = userConceptAttempts.get(key);

      if (!entry && totalConceptQuestions === 0) continue;

      const totalAttempts = entry?.total || 0;
      const totalCorrect = entry?.correct || 0;
      const uniqueCorrect = entry?.uniqueCorrect.size || 0;

      const scaledScore = computeScaledMastery({
        totalConceptQuestions: Math.max(1, totalConceptQuestions),
        uniqueQuestionsCorrect: uniqueCorrect,
        totalAttempts,
        totalCorrect,
      });

      rowsToUpsert.push({
        user_id: student.id,
        concept_id: concept.id,
        score: scaledScore,
        attempts_count: totalAttempts,
        correct_count: totalCorrect,
        updated_at: now,
      });
    }
  }

  console.log(`Preparing to batch upsert ${rowsToUpsert.length} mastery rows...`);

  // Batch in chunks of 50
  for (let i = 0; i < rowsToUpsert.length; i += 50) {
    const chunk = rowsToUpsert.slice(i, i + 50);
    const { error: upsertErr } = await supabase
      .from("mastery")
      .upsert(chunk, { onConflict: "user_id,concept_id" });

    if (upsertErr) {
      console.error("Upsert error on chunk:", upsertErr);
    }
  }

  console.log(`✅ Successfully synchronized ${rowsToUpsert.length} mastery rows!`);
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
