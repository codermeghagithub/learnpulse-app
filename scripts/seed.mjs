#!/usr/bin/env node
/**
 * LearnPulse — Demo Workspace Seed Script (ESM)
 *
 * Seeds 5 Core CS Courses:
 *   1. Data Structures & Algorithms
 *   2. Operating Systems
 *   3. Database Management Systems
 *   4. Computer Networks
 *   5. Object-Oriented Programming
 *
 * Validates DAG edges via topological sort (cycle check) on every course.
 * Generates realistic student attempts with spread timestamps & variance.
 * Computes deterministic EWMA mastery for every concept.
 *
 * Run natively with Node.js 22+:
 *   node --env-file=.env.local scripts/seed.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { dsaCourse } from "../supabase/seed/dsa.mjs";
import { osCourse } from "../supabase/seed/os.mjs";
import { dbmsCourse } from "../supabase/seed/dbms.mjs";
import { cnCourse } from "../supabase/seed/cn.mjs";
import { oopsCourse } from "../supabase/seed/oops.mjs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  console.error("Make sure to run with: node --env-file=.env.local scripts/seed.mjs");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/**
 * Canonical bank-aware scaled mastery computation (identical to src/lib/algorithms/mastery.ts).
 * Guarantees zero formula divergence between seed scripts, offline queue, and /api/submit-attempt.
 */
function computeScaledMastery({
  totalConceptQuestions,
  uniqueQuestionsCorrect,
  totalAttempts,
  totalCorrect,
}) {
  if (totalConceptQuestions <= 0 || uniqueQuestionsCorrect <= 0 || totalAttempts <= 0) {
    return 0;
  }

  const coverage = Math.min(1, Math.max(0, uniqueQuestionsCorrect / totalConceptQuestions));
  const accuracy = Math.min(1, Math.max(0, totalCorrect / totalAttempts));

  const basePoints = 80 * coverage;
  const accuracyBonus = 20 * coverage * accuracy;

  const finalScore = Math.round(basePoints + accuracyBonus);
  return Math.max(0, Math.min(100, finalScore));
}

// Graph algorithms for topological sort and cycle-check (reusing exact logic from graph.ts)
function buildAdjacencyList(edges) {
  const prerequisites = new Map();
  const dependents = new Map();

  for (const edge of edges) {
    if (!prerequisites.has(edge.concept_id)) {
      prerequisites.set(edge.concept_id, []);
    }
    prerequisites.get(edge.concept_id).push({
      id: edge.prerequisite_id,
      weight: edge.weight,
    });

    if (!dependents.has(edge.prerequisite_id)) {
      dependents.set(edge.prerequisite_id, []);
    }
    dependents.get(edge.prerequisite_id).push({
      id: edge.concept_id,
      weight: edge.weight,
    });
  }

  return { prerequisites, dependents };
}

function topologicalSort(conceptIds, adj) {
  const inDegree = new Map();
  const conceptSet = new Set(conceptIds);

  for (const id of conceptIds) {
    inDegree.set(id, 0);
  }

  for (const id of conceptIds) {
    const deps = adj.dependents.get(id) ?? [];
    for (const dep of deps) {
      if (conceptSet.has(dep.id)) {
        inDegree.set(dep.id, (inDegree.get(dep.id) ?? 0) + 1);
      }
    }
  }

  const queue = [];
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(id);
  }

  const sorted = [];
  while (queue.length > 0) {
    const current = queue.shift();
    sorted.push(current);

    const deps = adj.dependents.get(current) ?? [];
    for (const dep of deps) {
      if (!conceptSet.has(dep.id)) continue;
      const newDegree = (inDegree.get(dep.id) ?? 0) - 1;
      inDegree.set(dep.id, newDegree);
      if (newDegree === 0) queue.push(dep.id);
    }
  }

  if (sorted.length !== conceptIds.length) return null;
  return sorted;
}

const COURSES = [dsaCourse, osCourse, dbmsCourse, cnCourse, oopsCourse];

const TEACHER_EMAIL = process.env.DEMO_TEACHER_EMAIL || "teacher@demo.learnpulse.dev";
const TEACHER_PASSWORD = process.env.DEMO_TEACHER_PASSWORD || "Demo@12345";
const TEACHER_NAME = "Prof. Arjun Mehta";
const DEFAULT_STUDENT_PASSWORD = process.env.DEMO_STUDENT_PASSWORD || "Demo@12345";

const STUDENT_SEEDS = [
  { email: "priya@demo.learnpulse.dev", name: "Priya Sharma", password: DEFAULT_STUDENT_PASSWORD },
  { email: "rohit@demo.learnpulse.dev", name: "Rohit Verma", password: DEFAULT_STUDENT_PASSWORD },
  { email: "ananya@demo.learnpulse.dev", name: "Ananya Singh", password: DEFAULT_STUDENT_PASSWORD },
  { email: "karthik@demo.learnpulse.dev", name: "Karthik Nair", password: DEFAULT_STUDENT_PASSWORD },
  { email: "divya@demo.learnpulse.dev", name: "Divya Iyer", password: DEFAULT_STUDENT_PASSWORD },
  { email: "siddharth@demo.learnpulse.dev", name: "Siddharth Rao", password: DEFAULT_STUDENT_PASSWORD },
];

/**
 * Standardized attempt generator across all 5 subjects
 * Produces consistent variance patterns across courses for all 6 student profiles.
 */
function generateStudentAttempts() {
  const result = {
    priya: [],
    rohit: [],
    ananya: [],
    karthik: [],
    divya: [],
    siddharth: [],
  };

  const courseConfigs = [
    {
      course: "dsa",
      concepts: ["arrays", "linked-lists", "stacks", "recursion", "trees", "graphs", "sorting", "searching"],
      priyaGap: "recursion",
      priyaRootCause: "linked-lists",
      priyaLow: "stacks",
    },
    {
      course: "os",
      concepts: ["processes", "threads", "scheduling", "deadlocks", "memory-management"],
      priyaGap: "deadlocks",
      priyaRootCause: "scheduling",
      priyaLow: null,
    },
    {
      course: "dbms",
      concepts: ["er-model", "relational-model", "normalization", "sql-joins", "transactions"],
      priyaGap: "transactions",
      priyaRootCause: "relational-model",
      priyaLow: "normalization",
    },
    {
      course: "cn",
      concepts: ["osi-model", "tcp-ip", "routing", "congestion-control", "sockets"],
      priyaGap: "congestion-control",
      priyaRootCause: "routing",
      priyaLow: null,
    },
    {
      course: "oops",
      concepts: ["classes-objects", "inheritance", "polymorphism", "abstraction", "interfaces"],
      priyaGap: "abstraction",
      priyaRootCause: "polymorphism",
      priyaLow: null,
    },
  ];

  for (const cfg of courseConfigs) {
    const { concepts, priyaGap, priyaRootCause, priyaLow } = cfg;

    // 1. Priya: Target gap (0%), Root Cause (~34%), Strong concepts (~70-80%)
    for (const conceptKey of concepts) {
      if (conceptKey === priyaGap) {
        result.priya.push(
          { conceptKey, isCorrect: false, hoursAgo: 48 },
          { conceptKey, isCorrect: false, hoursAgo: 24 },
          { conceptKey, isCorrect: false, hoursAgo: 8 },
          { conceptKey, isCorrect: false, hoursAgo: 2 }
        );
      } else if (conceptKey === priyaRootCause) {
        // q[0] mastered, q[1] unmastered: 50% coverage, 2/5 accuracy -> 44% scaled mastery (Bottleneck / At Risk)
        result.priya.push(
          { conceptKey, isCorrect: true, hoursAgo: 140 },  // q[0] correct
          { conceptKey, isCorrect: false, hoursAgo: 110 }, // q[1] wrong
          { conceptKey, isCorrect: true, hoursAgo: 80 },   // q[0] correct
          { conceptKey, isCorrect: false, hoursAgo: 40 },  // q[1] wrong
          { conceptKey, isCorrect: false, hoursAgo: 10 }   // q[0] wrong
        );
      } else if (conceptKey === priyaLow) {
        // q[0] partially understood, q[1] unmastered: 50% coverage, 1/4 accuracy -> 43% scaled mastery
        result.priya.push(
          { conceptKey, isCorrect: true, hoursAgo: 130 },  // q[0] correct
          { conceptKey, isCorrect: false, hoursAgo: 90 },  // q[1] wrong
          { conceptKey, isCorrect: false, hoursAgo: 50 },  // q[0] wrong
          { conceptKey, isCorrect: false, hoursAgo: 15 }   // q[1] wrong
        );
      } else {
        result.priya.push(
          { conceptKey, isCorrect: true, hoursAgo: 200 },
          { conceptKey, isCorrect: true, hoursAgo: 160 },
          { conceptKey, isCorrect: true, hoursAgo: 120 },
          { conceptKey, isCorrect: true, hoursAgo: 80 },
          { conceptKey, isCorrect: true, hoursAgo: 50 },
          { conceptKey, isCorrect: true, hoursAgo: 20 }
        );
      }
    }

    // 2. Rohit: Chronic struggling student (mastery ~15-25% across all concepts)
    for (const conceptKey of concepts) {
      result.rohit.push(
        { conceptKey, isCorrect: true, hoursAgo: 160 },
        { conceptKey, isCorrect: false, hoursAgo: 120 },
        { conceptKey, isCorrect: false, hoursAgo: 80 },
        { conceptKey, isCorrect: false, hoursAgo: 40 },
        { conceptKey, isCorrect: false, hoursAgo: 10 }
      );
    }

    // 3. Ananya: Top achiever (mastery ~75-88% across all concepts)
    for (const conceptKey of concepts) {
      result.ananya.push(
        { conceptKey, isCorrect: true, hoursAgo: 220 },
        { conceptKey, isCorrect: true, hoursAgo: 180 },
        { conceptKey, isCorrect: true, hoursAgo: 140 },
        { conceptKey, isCorrect: true, hoursAgo: 100 },
        { conceptKey, isCorrect: true, hoursAgo: 60 },
        { conceptKey, isCorrect: true, hoursAgo: 30 },
        { conceptKey, isCorrect: true, hoursAgo: 5 }
      );
    }

    // 4. Karthik: Average / steady student (mastery ~50-65% across all concepts)
    for (const conceptKey of concepts) {
      result.karthik.push(
        { conceptKey, isCorrect: true, hoursAgo: 180 },
        { conceptKey, isCorrect: true, hoursAgo: 140 },
        { conceptKey, isCorrect: false, hoursAgo: 100 },
        { conceptKey, isCorrect: true, hoursAgo: 70 },
        { conceptKey, isCorrect: false, hoursAgo: 40 },
        { conceptKey, isCorrect: true, hoursAgo: 15 }
      );
    }

    // 5. Divya: Beginner / early-stage (only first 2 concepts attempted)
    const introConcepts = concepts.slice(0, 2);
    for (const conceptKey of introConcepts) {
      result.divya.push(
        { conceptKey, isCorrect: true, hoursAgo: 160 },
        { conceptKey, isCorrect: false, hoursAgo: 110 },
        { conceptKey, isCorrect: true, hoursAgo: 60 },
        { conceptKey, isCorrect: false, hoursAgo: 20 }
      );
    }

    // 6. Siddharth: Inactive student (1-2 attempts from > 350 hours ago)
    const inactiveConcept = concepts[0];
    result.siddharth.push(
      { conceptKey: inactiveConcept, isCorrect: false, hoursAgo: 450 },
      { conceptKey: inactiveConcept, isCorrect: true, hoursAgo: 400 }
    );
  }

  return result;
}

const STUDENT_ATTEMPTS = generateStudentAttempts();

async function getOrCreateUser(email, password, name, role) {
  const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
  if (signInData.user) return signInData.user;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, role },
  });
  if (error) throw new Error(`Failed to create user ${email}: ${error.message}`);
  return data.user;
}

async function main() {
  console.log("\n🌱 LearnPulse — 5 Core CS Subjects Seed Script\n");

  // 1. Validate All Course Graphs First (DAG Cycle Check & Topo Sort)
  console.log("Validating all course prerequisite graphs (DAG & Topo-Sort)...");
  for (const course of COURSES) {
    const conceptKeys = course.concepts.map((c) => c.key);
    const edgesForGraph = course.edges.map((e) => ({
      concept_id: e.to,
      prerequisite_id: e.from,
      weight: e.weight,
    }));
    const adj = buildAdjacencyList(edgesForGraph);
    const sorted = topologicalSort(conceptKeys, adj);
    if (!sorted) {
      throw new Error(`❌ Cycle detected in course graph: "${course.title}"`);
    }
    console.log(`  ✓ ${course.title} passed DAG check: [${sorted.join(" → ")}]`);
  }
  console.log("All course graphs successfully validated.\n");

  // 2. Create Teacher
  console.log("Setting up Teacher account...");
  const teacher = await getOrCreateUser(TEACHER_EMAIL, TEACHER_PASSWORD, TEACHER_NAME, "teacher");
  console.log(`  ✓ Teacher: ${TEACHER_EMAIL} (${teacher.id})`);

  await supabase.from("profiles").upsert({
    id: teacher.id,
    full_name: TEACHER_NAME,
    role: "teacher",
  });

  // Global map of conceptKey -> conceptId across all courses
  const globalConceptKeyToId = new Map();
  // Map of courseId -> course
  const courseIdMap = new Map();

  // 3. Seed Each Course, Concepts, Edges, and Questions
  for (const courseDef of COURSES) {
    console.log(`\nProcessing Course: ${courseDef.title}...`);

    const { data: existingCourse } = await supabase
      .from("courses")
      .select("id")
      .eq("teacher_id", teacher.id)
      .eq("title", courseDef.title)
      .maybeSingle();

    let courseId;
    if (existingCourse) {
      courseId = existingCourse.id;
      console.log(`  ✓ Existing course reused: ${courseId}`);
    } else {
      const { data: newCourse, error } = await supabase
        .from("courses")
        .insert({
          teacher_id: teacher.id,
          title: courseDef.title,
          subject: courseDef.subject,
        })
        .select("id")
        .single();
      if (error || !newCourse) throw new Error(`Failed to create course "${courseDef.title}": ${error?.message}`);
      courseId = newCourse.id;
      console.log(`  ✓ Created course: ${courseId}`);
    }
    courseIdMap.set(courseId, courseDef);

    // Seed Concepts
    const localConceptKeyToId = new Map();
    for (const concept of courseDef.concepts) {
      const { data: existingConcept } = await supabase
        .from("concepts")
        .select("id")
        .eq("course_id", courseId)
        .eq("name", concept.name)
        .maybeSingle();

      if (existingConcept) {
        localConceptKeyToId.set(concept.key, existingConcept.id);
        globalConceptKeyToId.set(concept.key, existingConcept.id);
      } else {
        const { data: newConcept, error } = await supabase
          .from("concepts")
          .insert({
            course_id: courseId,
            name: concept.name,
            difficulty: concept.difficulty,
            description: concept.description,
          })
          .select("id")
          .single();
        if (error || !newConcept) throw new Error(`Failed to create concept "${concept.name}": ${error?.message}`);
        localConceptKeyToId.set(concept.key, newConcept.id);
        globalConceptKeyToId.set(concept.key, newConcept.id);
        console.log(`    + Concept: ${concept.name}`);
      }
    }

    // Seed Edges
    for (const edge of courseDef.edges) {
      const prereqId = localConceptKeyToId.get(edge.from);
      const conceptId = localConceptKeyToId.get(edge.to);
      if (!prereqId || !conceptId) {
        console.warn(`    ⚠️ Missing IDs for edge: ${edge.from} → ${edge.to}`);
        continue;
      }
      const { error: edgeErr } = await supabase.from("concept_edges").upsert(
        {
          course_id: courseId,
          prerequisite_id: prereqId,
          concept_id: conceptId,
          weight: edge.weight,
        },
        { onConflict: "prerequisite_id,concept_id", ignoreDuplicates: true }
      );
      if (edgeErr) console.warn(`    Edge upsert warning: ${edgeErr.message}`);
    }
    console.log(`  ✓ Prerequisite edges seeded (${courseDef.edges.length})`);

    // Seed Questions
    let qCount = 0;
    for (const [conceptKey, qList] of Object.entries(courseDef.questions)) {
      const conceptId = localConceptKeyToId.get(conceptKey);
      if (!conceptId) continue;

      for (const q of qList) {
        const { data: existingQ } = await supabase
          .from("questions")
          .select("id")
          .eq("concept_id", conceptId)
          .eq("question_text", q.question_text)
          .maybeSingle();

        if (!existingQ) {
          const { error: qErr } = await supabase.from("questions").insert({
            course_id: courseId,
            concept_id: conceptId,
            question_text: q.question_text,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            difficulty: q.difficulty,
          });
          if (!qErr) qCount++;
        } else {
          qCount++;
        }
      }
    }
    console.log(`  ✓ Questions verified/seeded (${qCount} total for ${courseDef.title})`);
  }

  // 4. Seed Students & Realistic Attempts with Timestamps
  console.log("\nSeeding student accounts and computing mastery from attempt variance...");

  // Pre-fetch all questions to avoid N+1 queries during attempt generation
  const { data: allQuestions } = await supabase
    .from("questions")
    .select("id, concept_id, correct_answer, difficulty");

  const questionsByConceptId = new Map();
  for (const q of allQuestions ?? []) {
    if (!questionsByConceptId.has(q.concept_id)) {
      questionsByConceptId.set(q.concept_id, []);
    }
    questionsByConceptId.get(q.concept_id).push(q);
  }

  for (const studentSeed of STUDENT_SEEDS) {
    const studentKey = studentSeed.name.split(" ")[0].toLowerCase();
    const attemptsPattern = STUDENT_ATTEMPTS[studentKey] ?? [];

    console.log(`\n  Student: ${studentSeed.name} (${studentSeed.email})`);
    const student = await getOrCreateUser(studentSeed.email, studentSeed.password, studentSeed.name, "student");

    await supabase.from("profiles").upsert({
      id: student.id,
      full_name: studentSeed.name,
      role: "student",
    });

    // Ensure strict idempotency & ACID integrity: clear previous attempts and mastery for demo student before re-seeding
    await supabase.from("attempts").delete().eq("user_id", student.id);
    await supabase.from("mastery").delete().eq("user_id", student.id);

    // Map: conceptKey -> { attempts: [], lastUpdatedAt: string }
    const studentMasteryTracker = new Map();
    const attemptsToInsert = [];

    for (const attempt of attemptsPattern) {
      const conceptId = globalConceptKeyToId.get(attempt.conceptKey);
      if (!conceptId) continue;

      const questions = questionsByConceptId.get(conceptId);
      if (!questions || questions.length === 0) continue;

      // Pick question based on attempt index to cycle questions
      if (!studentMasteryTracker.has(attempt.conceptKey)) {
        studentMasteryTracker.set(attempt.conceptKey, {
          conceptId,
          attempts: [],
          lastAttemptTime: null,
        });
      }
      const tracker = studentMasteryTracker.get(attempt.conceptKey);
      const qIndex = tracker.attempts.length % questions.length;
      const q = questions[qIndex];

      const selectedAnswer = attempt.isCorrect
        ? q.correct_answer
        : ["A", "B", "C", "D"].find((a) => a !== q.correct_answer) ?? "A";

      const createdAt = new Date(Date.now() - (attempt.hoursAgo ?? 12) * 3600000).toISOString();

      attemptsToInsert.push({
        user_id: student.id,
        question_id: q.id,
        selected_answer: selectedAnswer,
        is_correct: attempt.isCorrect,
        created_at: createdAt,
      });

      tracker.attempts.push({
        questionId: q.id,
        isCorrect: attempt.isCorrect,
        difficulty: q.difficulty,
        createdAt,
      });

      if (!tracker.lastAttemptTime || createdAt > tracker.lastAttemptTime) {
        tracker.lastAttemptTime = createdAt;
      }
    }

    // Batch insert attempts in chunks of 50
    for (let i = 0; i < attemptsToInsert.length; i += 50) {
      const batch = attemptsToInsert.slice(i, i + 50);
      await supabase.from("attempts").insert(batch);
    }

    // Compute bank-aware scaled mastery (identical to /api/submit-attempt)
    const masteryToUpsert = [];
    for (const [conceptKey, tracker] of studentMasteryTracker.entries()) {
      if (tracker.attempts.length === 0) continue;

      const conceptQuestions = questionsByConceptId.get(tracker.conceptId) ?? [];
      const totalConceptQuestions = Math.max(1, conceptQuestions.length);
      const uniqueCorrect = new Set(
        tracker.attempts.filter((a) => a.isCorrect).map((a) => a.questionId)
      ).size;
      const totalAttempts = tracker.attempts.length;
      const totalCorrect = tracker.attempts.filter((a) => a.isCorrect).length;

      const score = computeScaledMastery({
        totalConceptQuestions,
        uniqueQuestionsCorrect: uniqueCorrect,
        totalAttempts,
        totalCorrect,
      });

      masteryToUpsert.push({
        user_id: student.id,
        concept_id: tracker.conceptId,
        score,
        attempts_count: totalAttempts,
        correct_count: totalCorrect,
        updated_at: tracker.lastAttemptTime ?? new Date().toISOString(),
      });

      console.log(`    - ${conceptKey}: ${totalAttempts} attempts, ${totalCorrect} correct, ${uniqueCorrect}/${totalConceptQuestions} unique → ${score}% mastery`);
    }

    if (masteryToUpsert.length > 0) {
      await supabase.from("mastery").upsert(masteryToUpsert, { onConflict: "user_id,concept_id" });
    }
  }

  console.log("\n✅ All 5 courses, concepts, DAG edges, and student mastery seeded successfully!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
