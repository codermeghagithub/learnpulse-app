const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function run() {
  console.log("1. Authenticating as student...");
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: process.env.TEST_STUDENT_EMAIL || "priya@demo.learnpulse.dev",
      password: process.env.TEST_STUDENT_PASSWORD || process.env.DEMO_STUDENT_PASSWORD || "Demo@12345",
    }),
  });

  const authData = await authRes.json();
  if (!authData.access_token) {
    console.error("Auth failed:", authData);
    process.exit(1);
  }
  
  const token = authData.access_token;
  console.log("✓ Authenticated successfully! User ID:", authData.user?.id);

  const payload = {
    questionId: "test-q1",
    questionText: "Which normal form eliminates partial dependency on a composite primary key?",
    selectedOptionText: "First Normal Form (1NF)",
    selectedKey: "A",
    correctOptionText: "Second Normal Form (2NF)",
    conceptName: "Database Normalization",
  };

  console.log("\n2. Calling /api/ai/misconception (First call - should call AI)...");
  const t0 = performance.now();
  const res1 = await fetch("http://localhost:3000/api/ai/misconception", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data1 = await res1.json();
  const t1 = performance.now();
  console.log(`First call completed in ${(t1 - t0).toFixed(1)}ms:`);
  console.log(JSON.stringify(data1, null, 2));

  console.log("\n3. Calling /api/ai/misconception (Second call - should hit in-memory cache <5ms)...");
  const t2 = performance.now();
  const res2 = await fetch("http://localhost:3000/api/ai/misconception", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data2 = await res2.json();
  const t3 = performance.now();
  console.log(`Second call completed in ${(t3 - t2).toFixed(1)}ms:`);
  console.log(JSON.stringify(data2, null, 2));

  if (data1.thoughtTrap && data1.mentalAnchor && data2.cached === true) {
    console.log("\n🎉 ALL TESTS PASSED: Mental Mirror diagnoses misconceptions efficiently and caches results!");
  } else {
    console.error("\n❌ Test failed to meet expectations.");
    process.exit(1);
  }
}

run().catch(console.error);
