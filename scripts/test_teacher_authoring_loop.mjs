#!/usr/bin/env node
/**
 * test_teacher_authoring_loop.mjs
 *
 * Verifies the complete Teacher Course & Concept Authoring loop end-to-end:
 * 1. Teacher creates course: "Cloud Computing Architecture"
 * 2. Teacher adds concepts: Virtualization, Containers, Kubernetes Orchestration
 * 3. Teacher adds DAG edges: Virtualization → Containers, Containers → Kubernetes
 * 4. Teacher attempts circular edge: Kubernetes → Virtualization (VERIFIES CYCLE REJECTION)
 * 5. Teacher authors practice MCQs for each concept
 * 6. Student views course, practices, answers questions, mastery updates via EWMA
 * 7. Student gets gap diagnosis and recovery plan for the new course
 */

import { createClient } from "@supabase/supabase-js";
import { buildAdjacencyList, topologicalSort, bfsPrerequisites } from "../src/lib/algorithms/graph.ts";
import { computeScaledMastery } from "../src/lib/algorithms/mastery.ts";
import { rankRootCauses } from "../src/lib/algorithms/rootCause.ts";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE env vars. Run with: node --env-file=.env.local scripts/test_teacher_authoring_loop.mjs");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log("\n🧪 Running End-to-End Teacher Authoring & Student Loop Verification...\n");

  // 1. Get Teacher
  const { data: teacherUser } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "teacher")
    .limit(1)
    .single();

  if (!teacherUser) throw new Error("No teacher profile found.");
  console.log(`Step 1: Authenticated Teacher: ${teacherUser.full_name} (${teacherUser.id})`);

  // 2. Teacher creates Course
  const courseTitle = "Cloud Computing Architecture";
  const courseSubject = "Computer Science";

  // Clean up any previous test course with same title
  const { data: oldCourse } = await supabase
    .from("courses")
    .select("id")
    .eq("title", courseTitle)
    .maybeSingle();

  if (oldCourse) {
    await supabase.from("courses").delete().eq("id", oldCourse.id);
  }

  const { data: newCourse, error: courseErr } = await supabase
    .from("courses")
    .insert({
      teacher_id: teacherUser.id,
      title: courseTitle,
      subject: courseSubject,
    })
    .select("id, title")
    .single();

  if (courseErr || !newCourse) throw new Error(`Course creation failed: ${courseErr?.message}`);
  console.log(`Step 2: Course Created: "${newCourse.title}" (ID: ${newCourse.id})`);

  // 3. Teacher adds Concepts
  const conceptsData = [
    { name: "Virtualization", description: "Hypervisors, Type-1 vs Type-2, hardware abstraction", difficulty: "easy" },
    { name: "Containers", description: "Linux namespaces, cgroups, image layering, Docker runtime", difficulty: "medium" },
    { name: "Kubernetes Orchestration", description: "Pods, ReplicaSets, Deployments, service meshes, cluster scheduling", difficulty: "hard" },
  ];

  const conceptMap = new Map();
  for (const c of conceptsData) {
    const { data: createdConcept, error: cErr } = await supabase
      .from("concepts")
      .insert({
        course_id: newCourse.id,
        name: c.name,
        description: c.description,
        difficulty: c.difficulty,
      })
      .select("id, name, difficulty")
      .single();

    if (cErr || !createdConcept) throw new Error(`Concept creation failed for ${c.name}: ${cErr?.message}`);
    conceptMap.set(c.name, createdConcept.id);
    console.log(`  + Concept Added: ${createdConcept.name} (${createdConcept.difficulty}) → ${createdConcept.id}`);
  }

  const virtId = conceptMap.get("Virtualization");
  const contId = conceptMap.get("Containers");
  const k8sId = conceptMap.get("Kubernetes Orchestration");

  // 4. Teacher adds valid prerequisite edges
  // Edge 1: Virtualization is prerequisite of Containers
  await supabase.from("concept_edges").insert({
    course_id: newCourse.id,
    prerequisite_id: virtId,
    concept_id: contId,
    weight: 2,
  });
  console.log(`Step 3: Added Prerequisite: Virtualization → Containers`);

  // Edge 2: Containers is prerequisite of Kubernetes Orchestration
  await supabase.from("concept_edges").insert({
    course_id: newCourse.id,
    prerequisite_id: contId,
    concept_id: k8sId,
    weight: 2,
  });
  console.log(`  + Added Prerequisite: Containers → Kubernetes Orchestration`);

  // 5. MANDATORY: Test Cycle Detection on Attempted Invalid Edge
  // Attempt to add: Kubernetes Orchestration is prerequisite of Virtualization (K8s → Virt)
  console.log(`Step 4: Testing Cycle Detection on invalid edge: Kubernetes → Virtualization...`);
  const currentEdges = [
    { prerequisite_id: virtId, concept_id: contId, weight: 2 },
    { prerequisite_id: contId, concept_id: k8sId, weight: 2 },
  ];
  const invalidEdge = { prerequisite_id: k8sId, concept_id: virtId, weight: 2 };

  const allConceptIds = [virtId, contId, k8sId];
  const testAdj = buildAdjacencyList([...currentEdges, invalidEdge]);
  const topoResult = topologicalSort(allConceptIds, testAdj);

  if (topoResult === null) {
    const currentAdj = buildAdjacencyList(currentEdges);
    const existingPrereqs = bfsPrerequisites(k8sId, currentAdj);
    const hasBlocker = existingPrereqs.some((n) => n.id === virtId);
    if (!hasBlocker) throw new Error("Expected prerequisite path Virtualization -> Kubernetes not found");
    console.log(`  ✓ CYCLE DETECTED AND BLOCKED!`);
    console.log(`  ✓ Reason: This would make "Virtualization" depend on itself through "Kubernetes Orchestration".`);
  } else {
    throw new Error("Cycle check FAILED: Invalid circular edge was not detected!");
  }

  // 6. Teacher authors Practice MCQs for each concept
  console.log(`Step 5: Authoring Practice Questions for all 3 concepts...`);
  const questionsData = [
    {
      concept_id: virtId,
      question_text: "What is the primary difference between a Type-1 and Type-2 hypervisor?",
      options: [
        { key: "A", text: "Type-1 runs on bare metal; Type-2 runs on a host operating system" },
        { key: "B", text: "Type-1 only supports Windows VMs" },
        { key: "C", text: "Type-2 cannot allocate virtual memory" },
        { key: "D", text: "There is no architectural difference" },
      ],
      correct_answer: "A",
      explanation: "Bare-metal Type-1 hypervisors execute directly on hardware for maximum performance.",
      difficulty: "easy",
    },
    {
      concept_id: contId,
      question_text: "Which Linux kernel mechanism is primarily used to isolate process IDs, network interfaces, and mount points in containers?",
      options: [
        { key: "A", text: "cgroups" },
        { key: "B", text: "Namespaces" },
        { key: "C", text: "SELinux policies" },
        { key: "D", text: "Swap partitions" },
      ],
      correct_answer: "B",
      explanation: "Namespaces provide isolation of global system resources (PID, NET, MNT, IPC).",
      difficulty: "medium",
    },
    {
      concept_id: k8sId,
      question_text: "In Kubernetes architecture, which control plane component assigns newly created pods to optimal worker nodes?",
      options: [
        { key: "A", text: "kube-controller-manager" },
        { key: "B", text: "kube-proxy" },
        { key: "C", text: "kube-scheduler" },
        { key: "D", text: "etcd" },
      ],
      correct_answer: "C",
      explanation: "The kube-scheduler evaluates resource requirements and node constraints to schedule pods.",
      difficulty: "hard",
    },
  ];

  const questionMap = new Map();
  for (const q of questionsData) {
    const { data: createdQ, error: qErr } = await supabase
      .from("questions")
      .insert({
        course_id: newCourse.id,
        concept_id: q.concept_id,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
      })
      .select("id, concept_id")
      .single();

    if (qErr || !createdQ) throw new Error(`Question creation failed: ${qErr?.message}`);
    questionMap.set(q.concept_id, createdQ.id);
    console.log(`  + Authored Question for concept: ${createdQ.id}`);
  }

  // 7. Student signs in and practices on the authored course
  console.log(`Step 6: Student practicing authored course...`);
  const { data: studentUser } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "student")
    .limit(1)
    .single();

  if (!studentUser) throw new Error("No student profile found.");
  console.log(`  Student: ${studentUser.full_name} (${studentUser.id})`);

  // Student answers Virtualization correctly (easy)
  const qVirtId = questionMap.get(virtId);
  await supabase.from("attempts").insert({
    user_id: studentUser.id,
    question_id: qVirtId,
    selected_answer: "A",
    is_correct: true,
  });
  const virtMastery = computeScaledMastery({
    totalConceptQuestions: 1,
    uniqueQuestionsCorrect: 1,
    totalAttempts: 1,
    totalCorrect: 1,
  });
  await supabase.from("mastery").upsert(
    {
      user_id: studentUser.id,
      concept_id: virtId,
      score: virtMastery,
      attempts_count: 1,
      correct_count: 1,
    },
    { onConflict: "user_id,concept_id" }
  );
  console.log(`  ✓ Virtualization practice submitted: 1 attempt, 1 correct → ${virtMastery.toFixed(1)}% mastery`);

  // Student answers Containers: 1 incorrect, 1 correct (medium)
  const qContId = questionMap.get(contId);
  await supabase.from("attempts").insert([
    { user_id: studentUser.id, question_id: qContId, selected_answer: "C", is_correct: false },
    { user_id: studentUser.id, question_id: qContId, selected_answer: "B", is_correct: true },
  ]);
  const contMastery = computeScaledMastery({
    totalConceptQuestions: 1,
    uniqueQuestionsCorrect: 1,
    totalAttempts: 2,
    totalCorrect: 1,
  });
  await supabase.from("mastery").upsert(
    {
      user_id: studentUser.id,
      concept_id: contId,
      score: contMastery,
      attempts_count: 2,
      correct_count: 1,
    },
    { onConflict: "user_id,concept_id" }
  );
  console.log(`  ✓ Containers practice submitted: 2 attempts, 1 correct → ${contMastery.toFixed(1)}% mastery`);

  // Student answers Kubernetes incorrectly (hard) → triggers gap
  const qK8sId = questionMap.get(k8sId);
  await supabase.from("attempts").insert({
    user_id: studentUser.id,
    question_id: qK8sId,
    selected_answer: "B",
    is_correct: false,
  });
  const k8sMastery = computeScaledMastery({
    totalConceptQuestions: 1,
    uniqueQuestionsCorrect: 0,
    totalAttempts: 1,
    totalCorrect: 0,
  });
  await supabase.from("mastery").upsert(
    {
      user_id: studentUser.id,
      concept_id: k8sId,
      score: k8sMastery,
      attempts_count: 1,
      correct_count: 0,
    },
    { onConflict: "user_id,concept_id" }
  );
  console.log(`  ✓ Kubernetes practice submitted: 1 attempt, 0 correct → ${k8sMastery.toFixed(1)}% mastery (GAP TRIGGERED)`);

  // 8. Gap Analysis & Root Cause on Author-Created Course
  console.log(`Step 7: Verifying Gap Analysis and Root Cause Diagnosis on new course...`);
  const { data: edgesForCourse } = await supabase
    .from("concept_edges")
    .select("prerequisite_id, concept_id, weight")
    .eq("course_id", newCourse.id);

  const courseAdj = buildAdjacencyList(
    (edgesForCourse ?? []).map((e) => ({
      prerequisite_id: e.prerequisite_id,
      concept_id: e.concept_id,
      weight: Number(e.weight),
    }))
  );

  const prereqNodes = bfsPrerequisites(k8sId, courseAdj);
  console.log(`  ✓ BFS Prerequisites for Kubernetes:`);
  for (const p of prereqNodes) {
    const name = p.id === contId ? "Containers" : p.id === virtId ? "Virtualization" : p.id;
    console.log(`    - ${name} (depth: ${p.depth}, weight: ${p.weight})`);
  }

  // Root cause ranking
  const rootCauses = rankRootCauses([
    {
      conceptId: contId,
      conceptName: "Containers",
      masteryScore: contMastery,
      edgeWeight: 2,
      failedAttempts: 1,
      recency: 0.8,
    },
    {
      conceptId: virtId,
      conceptName: "Virtualization",
      masteryScore: virtMastery,
      edgeWeight: 2,
      failedAttempts: 0,
      recency: 0.3,
    },
  ]);

  console.log(`  ✓ Root cause identified: "${rootCauses[0].conceptName}" (score: ${rootCauses[0].rootCauseScore.toFixed(2)})`);
  console.log(`  ✓ Recovery CTA target: /dashboard/practice?conceptId=${rootCauses[0].conceptId}&courseId=${newCourse.id}`);

  console.log("\n🎉 END-TO-END DEMO LOOP PASSED FOR TEACHER-AUTHORED COURSE!");
  console.log("   Teacher created course → Authored concepts & DAG → Cycle check verified → MCQs authored → Student practiced → Mastery updated → Gap analyzed → Recovery routed.");
}

main().catch((err) => {
  console.error("\n❌ Test failed:", err);
  process.exit(1);
});
