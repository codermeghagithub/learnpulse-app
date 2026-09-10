#!/usr/bin/env node
/**
 * reset_demo_data.mjs — LearnPulse Database Reset & Clean Synchronization
 *
 * 1. Removes all old demo student accounts and legacy dummy users.
 * 2. Establishes exactly 1 teacher and 3 students with simple credentials:
 *    - Teacher: sandip@gmail.com / sandip123 ("Prof Sandip Ghosal")
 *    - Student 1: rebortak@gmail.com / rebortak123 ("Rebortak Roy")
 *    - Student 2: arnab@gmail.com / arnab123 ("Arnab Roy")
 *    - Student 3: megha@gmail.com / megha123 ("Megha De")
 * 3. Wipes all courses, concepts, prerequisite edges, questions, attempts, mastery, and interventions.
 * 4. Leaves the application at a 100% clean slate with 0% baseline ready for real course creation.
 *
 * Usage:
 *   node --env-file=.env.local scripts/reset_demo_data.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  console.error("Run with: node --env-file=.env.local scripts/reset_demo_data.mjs");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const TARGET_TEACHER = {
  email: "sandip@gmail.com",
  password: "sandip123",
  name: "Prof Sandip Ghosal",
  role: "teacher",
};

const TARGET_STUDENTS = [
  { email: "rebortak@gmail.com", password: "rebortak123", name: "Rebortak Roy" },
  { email: "arnab@gmail.com", password: "arnab123", name: "Arnab Roy" },
  { email: "megha@gmail.com", password: "megha123", name: "Megha De" },
];

const KEEP_EMAILS = [
  "sandip@gmail.com",
  "rebortak@gmail.com",
  "arnab@gmail.com",
  "megha@gmail.com",
];

async function getOrCreateUser(email, password, fullName, role) {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const existing = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: { full_name: fullName, role, selectedCourseId: null, enrolledCourseIds: [] },
    });
    await supabase.from("profiles").upsert({
      id: existing.id,
      full_name: fullName,
      role,
    });
    return existing;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role, enrolledCourseIds: [] },
  });

  if (error) throw error;

  await supabase.from("profiles").upsert({
    id: data.user.id,
    full_name: fullName,
    role,
  });

  return data.user;
}

async function main() {
  console.log("\n🧹 LearnPulse — Database Reset & Clean Slate Synchronization\n");

  // 1. Wipe all courses, concepts, questions, attempts, mastery, and interventions
  console.log("1. Wiping all courses, concepts, questions, attempts, mastery, and interventions...");
  await supabase.from("courses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("attempts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("mastery").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("interventions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("concept_bites").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("questions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("concept_edges").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("concepts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("  ✓ All courses and data tables wiped to clean 0 state");

  // 2. Remove any obsolete accounts
  console.log("\n2. Removing obsolete user accounts...");
  const { data: { users } } = await supabase.auth.admin.listUsers();
  for (const u of users) {
    if (!KEEP_EMAILS.includes(u.email?.toLowerCase())) {
      console.log(`  ✓ Removed obsolete user: ${u.email} (${u.id})`);
      await supabase.from("profiles").delete().eq("id", u.id);
      await supabase.auth.admin.deleteUser(u.id);
    } else {
      // Clear selectedCourseId and enrolledCourseIds for fresh clean slate
      await supabase.auth.admin.updateUserById(u.id, {
        user_metadata: { ...u.user_metadata, selectedCourseId: null, enrolledCourseIds: [] },
      });
    }
  }

  // 3. Provision Teacher Account
  console.log("\n3. Provisioning Teacher account...");
  await getOrCreateUser(
    TARGET_TEACHER.email,
    TARGET_TEACHER.password,
    TARGET_TEACHER.name,
    TARGET_TEACHER.role
  );
  console.log(`  ✓ Teacher ready: ${TARGET_TEACHER.name} (${TARGET_TEACHER.email})`);

  // 4. Provision 3 Student Accounts
  console.log("\n4. Provisioning 3 Student accounts...");
  for (const s of TARGET_STUDENTS) {
    await getOrCreateUser(s.email, s.password, s.name, "student");
    console.log(`  ✓ Student ready: ${s.name} (${s.email})`);
  }

  console.log("\n============================================================");
  console.log("🎉 Clean Slate Ready! 0 courses, 0 attempts, 0 mastery.");
  console.log("============================================================");
  console.log("Teacher Account:");
  console.log(`  Email:    ${TARGET_TEACHER.email}`);
  console.log(`  Password: ${TARGET_TEACHER.password}`);
  console.log(`  Name:     ${TARGET_TEACHER.name}\n`);
  console.log("Student Accounts:");
  for (const s of TARGET_STUDENTS) {
    console.log(`  Email:    ${s.email}`);
    console.log(`  Password: ${s.password}`);
    console.log(`  Name:     ${s.name}\n`);
  }
}

main().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
