# LearnPulse 🧠⚡
### Autonomous Learning Continuity, Remediation & Cognitive Misconception Engine
> **Smart India Hackathon (SIH 2026) — Problem Statement: SIH 26207**  
> *"Know what you don't know — and why you chose what you chose."*

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres_%2B_Auth_%2B_RLS-emerald?logo=supabase)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash_%2B_Reasoning-orange?logo=google)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4_Modern_Design-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tests-63%2F63_Passing-brightgreen?logo=vitest)](https://vitest.dev/)
[![Security](https://img.shields.io/badge/Security-Zero_Secret_Leaks-success)](#security--privacy)

---

## 🌟 Executive Summary & Novelty

Most educational test platforms function as flat quiz websites with rote repetition:
- When a student fails a question, traditional systems show a generic textbook explanation of why the correct answer is right.
- Mastery is calculated through repetitive answer grinding that bores high performers and frustrates struggling students.
- Prerequisite dependencies between concepts are ignored, treating knowledge gaps as isolated failures.

**LearnPulse** transforms educational diagnostics with a high-performance **prerequisite graph + cognitive reverse-engineering engine**:

1. **DAG Prerequisite Graph Architecture**: Concepts form a Directed Acyclic Graph (DAG). When a student struggles on an advanced concept (e.g., *Query Optimization*), the engine executes BFS prerequisite backtracking to pinpoint the foundational blocker (e.g., *B-Tree Indexing*).
2. **Non-Repetitive Question-Bank-Aware Scaled Mastery**: An intelligent, non-repetitive session queue filters out answered questions and scales mastery based on question bank coverage and accuracy. Solving $1/1$ or $2/2$ concept questions awards **100% (Level 4 • Mastered)** without repetitive grinding.
3. **"Mental Mirror" AI Cognitive Misconception Deconstructor**: When a student chooses a distractor (wrong option), LearnPulse uses **Gemini 2.5 Flash** to reverse-engineer *why* the student's brain fell for that specific distractor, outputting:
   - **⚠️ The Thought Trap You Fell Into**: Diagnoses the cognitive conflation or misapplied heuristic.
   - **💡 10-Second Mental Anchor**: A punchy, memorable rule-of-thumb contrast formula.
   - **Zero-Latency In-Memory Cache**: Repeated option selections resolve in **<1ms** with zero redundant LLM queries or token waste.
4. **End-to-End Teacher Authoring with DAG Cycle Prevention**: Teachers can dynamically create courses, add concepts, connect prerequisite edges with Kahn's algorithm cycle rejection, and author MCQs.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | **Next.js 16** (App Router) | Server components, streaming SSR, and edge routing. |
| **Language** | **TypeScript 5 (Strict)** | End-to-end type safety across schemas, algorithms, and UI. |
| **Styling & UI** | **Tailwind CSS v4 + Vanilla CSS** | Premium glassmorphism design, micro-animations, accessible colors. |
| **Database & Auth** | **Supabase (PostgreSQL 15)** | Relational schemas, Row-Level Security (RLS), session cookies. |
| **AI Diagnosis** | **Google Gemini 2.5 Flash** | Low-latency cognitive deconstruction and structured JSON validation. |
| **Validation** | **Zod** | Runtime contract validation on all database and AI payloads. |
| **Testing** | **Vitest** | 63 automated unit and algorithm tests with 100% pass rate. |

---

## ⚡ Quick Start & Installation

### 1. Prerequisites
- **Node.js**: `v20.x` or higher (tested on Node v22)
- **npm**: `v10.x` or higher
- A free **Supabase** project ([supabase.com](https://supabase.com))
- A free **Google Gemini API Key** ([aistudio.google.com](https://aistudio.google.com/app/apikey))

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/learnpulse.git
cd learnpulse/learnpulse-app
npm install
```

### 3. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and provide your credentials:
```env
# Found in Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Found in Supabase Dashboard → Project Settings → API (never exposed client-side)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Found in Google AI Studio (never prefixed with NEXT_PUBLIC_)
GEMINI_API_KEY=your-gemini-api-key-here
```

### 4. Setup Database Schema
In your Supabase project dashboard:
1. Navigate to **SQL Editor** → **New Query**.
2. Copy and paste the contents of `supabase/schema.sql`.
3. Click **Run**.
4. *(Optional)* If you need to re-verify permissions, run `supabase/fix_rls.sql`.

### 5. Seed Pre-Configured Demo Data
Run the database seeder to populate courses, prerequisite DAGs, 190+ questions, and realistic student attempt histories:
```bash
node --env-file=.env.local scripts/seed.mjs
```

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Demo Accounts (For Judges & Evaluators)

All accounts come pre-configured with realistic attempts, mastery variance, and gap analyses:

| Role | Email | Password | Description |
|---|---|---|---|
| **Teacher** | `teacher@demo.learnpulse.dev` | `Demo@12345` | Can view student cohorts, author courses, connect DAG edges, and create questions. |
| **Student (Priya)** | `priya@demo.learnpulse.dev` | `Demo@12345` | Balanced high-achiever with targeted gaps in Database Normalization & Graph Traversals. |
| **Student (Rohit)** | `rohit@demo.learnpulse.dev` | `Demo@12345` | Developing student with multiple prerequisite bottlenecks. |
| **Student (Ananya)** | `ananya@demo.learnpulse.dev` | `Demo@12345` | Solid fundamentals across OS and Networks. |
| **Student (Karthik)**| `karthik@demo.learnpulse.dev` | `Demo@12345` | At-risk learner needing remediation in Memory Management. |
| **Student (Divya)**  | `divya@demo.learnpulse.dev` | `Demo@12345` | Consistent learner progressing across all 5 core CS subjects. |
| **Student (Siddharth)** | `siddharth@demo.learnpulse.dev` | `Demo@12345` | Advanced student reviewing Compiler Design and Cloud Architecture. |

---

## 🧩 Architectural Highlights & Algorithms

### 1. Prerequisite Graph Engine (`src/lib/algorithms/graph.ts`)
- **Single-Query Adjacency List**: Constructs directed graph representation $G = (V, E)$ in $O(V + E)$ time without $N+1$ database calls.
- **Topological Sorting**: Kahn’s algorithm detects and rejects cycle creation attempts during teacher authoring.
- **Prerequisite Backtracking**: BFS traversal traces backward from any failing concept to identify transitive ancestors and foundational gaps.

### 2. Question-Bank-Aware Scaled Mastery (`src/lib/algorithms/mastery.ts`)
Avoids artificial score decay and tedious grinding:
$$\text{Coverage} = \min\left(1, \frac{\text{uniqueQuestionsCorrect}}{\text{totalConceptQuestions}}\right)$$
$$\text{Accuracy} = \frac{\text{totalCorrect}}{\text{totalAttempts}}$$
$$\text{Mastery Score} = \text{round}\Big(\text{Coverage} \times (80 + 20 \times \text{Accuracy})\Big)$$

| Score Range | Stage Badge | Description |
|:---:|:---:|:---|
| **0 – 39%** | **Level 1 • Getting Started** | Initiating concept exposure. |
| **40 – 69%** | **Level 2 • Developing** | Partial question bank completion or mixed accuracy. |
| **70 – 84%** | **Level 3 • Proficient** | Majority of questions solved with strong accuracy. |
| **85 – 100%** | **Level 4 • Mastered 🏆** | Full bank coverage with high accuracy. |

### 3. "Mental Mirror" Misconception Deconstructor (`src/lib/ai/`)
- When a student picks an incorrect answer, `QuizCard.tsx` calls `/api/ai/misconception`.
- Gemini 2.5 Flash analyses the target concept, correct answer, and chosen distractor to synthesize why the student made that specific mistake.
- **Guaranteed Zero-Downtime Fallback**: If offline or rate-limited, an instant heuristic cognitive model renders immediately.

### 4. Root Cause Candidate Ranking (`src/lib/algorithms/rootCause.ts`)
When a student has a gap, prerequisite candidates are ranked via a weighted multi-factor heuristic:
$$\text{Rank Score} = 0.45 \cdot \text{Weakness} + 0.25 \cdot \text{EdgeWeight} + 0.20 \cdot \text{Evidence} + 0.10 \cdot \text{Recency}$$

---

## 🧪 Automated Testing & Verification

Run the comprehensive Vitest test suite:
```bash
npm run test:run
```
```
✓ src/lib/algorithms/__tests__/mastery.test.ts (15 tests)
✓ src/lib/__tests__/masteryLevels.test.ts (9 tests)
✓ src/lib/algorithms/__tests__/risk.test.ts (15 tests)
✓ src/lib/algorithms/__tests__/rootCause.test.ts (9 tests)
✓ src/lib/algorithms/__tests__/graph.test.ts (12 tests)
✓ src/lib/ai/__tests__/misconception.test.ts (3 tests)

Test Files  6 passed (6)
     Tests  63 passed (63)
```

Run TypeScript strict validation:
```bash
npx tsc --noEmit
```

Run the End-to-End Teacher Authoring & Student Loop Simulation:
```bash
node --env-file=.env.local scripts/test_teacher_authoring_loop.mjs
```

Test the Mental Mirror AI Misconception endpoint and cache:
```bash
node --env-file=.env.local scripts/test_misconception_api.mjs
```

---

## 🔒 Security & Privacy

- **Row-Level Security (RLS)**: Enforced on all PostgreSQL tables. Students can only access their own attempts, mastery records, and interventions.
- **Role Verification**: Server-side verification against the `profiles` table prevents client spoofing.
- **Client Bundle Isolation**: Secret keys (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are kept strictly server-side. Zero secrets are included in client bundles.
- **Repository Safety**: Hardened `.gitignore` ensures credentials (`.env*`) and local artifacts can never be pushed to Git.

---

## 📂 Project Structure

```
learnpulse-app/
├── public/                       # Favicons, illustrations, and static assets
├── scripts/                      # Verified utility and seed scripts
│   ├── seed.mjs                  # Database seeder (5 courses, 190+ questions)
│   ├── sync_mastery_scores.mjs   # Database mastery score recalculator
│   ├── test_misconception_api.mjs# Mental Mirror API & cache verification
│   └── test_teacher_authoring_loop.mjs # End-to-end authoring loop test
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Login & Signup flows
│   │   ├── api/
│   │   │   ├── ai/misconception/ # Mental Mirror cognitive diagnosis endpoint
│   │   │   ├── diagnose/         # Root-cause prerequisite intervention endpoint
│   │   │   └── submit-attempt/   # MCQ grading and mastery update endpoint
│   │   ├── dashboard/            # Student learning portal (Practice, Gaps, Progress)
│   │   └── teacher/              # Teacher portal (Cohorts, Course authoring, DAG editor)
│   ├── components/               # Modular UI components
│   │   ├── layout/               # Header, Sidebar, and App Shell
│   │   ├── mastery/              # MasteryBar, MasteryExplainerModal, ConceptChain
│   │   ├── practice/             # QuizCard (with Mental Mirror integration)
│   │   └── risk/                 # RiskBadge & indicators
│   ├── lib/
│   │   ├── ai/                   # Gemini client, prompt templates, Zod schemas
│   │   └── algorithms/           # Pure graph, mastery, risk, and root cause algorithms
│   └── utils/
│       └── supabase/             # Server & browser SSR client initializers
├── supabase/                     # Database migrations & schemas
│   ├── schema.sql                # Complete DDL, RLS policies, and triggers
│   ├── fix_rls.sql               # Dedicated RLS policy verifier
│   └── seed/                     # Domain question banks (DSA, OS, DBMS, CN, OOPS)
├── .env.local.example            # Safe environment template
├── .gitignore                    # Comprehensive Git protection rules
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## 👥 Authors & Acknowledgments

Developed with ❤️ for **Smart India Hackathon (SIH 2026)** — Problem Statement **SIH 26207**.
Built to empower educators and provide students with a true cognitive compass.
