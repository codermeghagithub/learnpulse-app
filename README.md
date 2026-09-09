# LearnPulse 🧠⚡
### Autonomous Learning Continuity, Remediation & Cognitive Misconception Engine
> **Smart India Hackathon (SIH 2026) — Problem Statement: SIH 26207**  
> *"Know what you don't know — and why you chose what you chose."*

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4_(Turbopack)-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_15_%2B_RLS-emerald?logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-orange?logo=google)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4_Modern_Design-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tests-101%2F101_Passing_(11_Suites)-brightgreen?logo=vitest)](https://vitest.dev/)
[![ESLint](https://img.shields.io/badge/ESLint-0_Errors_%7C_0_Warnings-purple?logo=eslint)](https://eslint.org/)
[![Security](https://img.shields.io/badge/Security-Audit_0_Vulnerabilities-success)](#-security-privacy--acid-integrity)

---

## 📑 Table of Contents
1. [Executive Summary & Novelty](#-executive-summary--novelty)
2. [Key Innovations & Features](#-key-innovations--features)
3. [System Architecture](#-system-architecture)
4. [Mathematical Formulations & Algorithms](#-mathematical-formulations--algorithms)
5. [Technology Stack](#-technology-stack)
6. [Quick Start & Installation](#-quick-start--installation)
7. [Demo Accounts for Evaluators](#-demo-accounts-for-evaluators)
8. [API Reference & Route Specifications](#-api-reference--route-specifications)
9. [Automated Testing & Quality Assurance](#-automated-testing--quality-assurance)
10. [Security, Privacy & ACID Integrity](#-security-privacy--acid-integrity)
11. [Project Directory Structure](#-project-directory-structure)
12. [License & Acknowledgments](#-license--acknowledgments)

---

## 🌟 Executive Summary & Novelty

Traditional learning platforms and computerized quizzes treat learning as a flat checklist:
* **Generic Explanations:** When a student chooses a wrong option, traditional tools output textbook summaries describing why the correct answer is right—ignoring *why* the student was tempted by the distractor.
* **Repetitive Grinding:** Students are forced through redundant loops to artificially raise percentages, causing high-performing learners to disengage and struggling students to memorize answers.
* **Isolated Failures:** Prerequisite dependencies are overlooked; a failure in *Query Optimization* is treated as an isolated gap rather than a failure in *B-Tree Indexing* or *Disk I/O Models*.

**LearnPulse** transforms educational diagnostics with a **graph-native prerequisite architecture + cognitive reverse-engineering engine**:

```mermaid
flowchart TD
    subgraph Trigger["1. Trigger Event"]
        A["👤 Student Selects Distractor Option"]
    end

    subgraph MentalMirror["2. Mental Mirror AI Engine"]
        B["⚠️ Thought Trap Deconstruction<br/>Reverse-engineers flawed cognitive model"]
        C["⚡ Cognitive Dissonance Paradox<br/>Collapses false heuristic with counter-example"]
        D["💡 10-Second Bilingual Anchor<br/>High-contrast rule in English + Hindi"]
    end

    subgraph GraphMap["3. Interactive Visual DAG Map"]
        E["🔍 BFS Prerequisite Backtracking<br/>Traverses ancestor dependency graph"]
        F["🎯 Multi-Factor Root Cause Ranking<br/>Isolates foundational bottleneck node"]
        G["📊 Dual Perspective View<br/>Student mastery path & Teacher cohort heatmap"]
    end

    subgraph Remediation["4. Remediation & Retention Loop"]
        H["🚀 60-Second Concept Bite<br/>Real-world intuition + high-contrast analogy"]
        I["🎲 Interactive Quick-Check Pool<br/>Tricky conceptual challenges verifying intuition"]
        J["⏳ Ebbinghaus Retention Reviews<br/>Decay-aware review testing forward dependencies"]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
```

---

## 🚀 Key Innovations & Features

### 1. Interactive Visual DAG Knowledge Graph (`@xyflow/react`)
* **Interactive Canvas:** Pan, zoom, node selection, depth-ranked topological tiers, and real-time color-coded mastery status (Mastered, Developing, At-Risk, Bottleneck).
* **Dual-Perspective Rendering:**
  * **Student Mode:** Shows personalized mastery score, prerequisite dependency breadcrumbs, and instant remediation triggers.
  * **Teacher Mode:** Automatically aggregates class-wide cohort averages, highlighting systemic bottlenecks across entire batches.

### 2. "Mental Mirror" AI Cognitive Misconception Engine
* **Deconstructive Feedback:** Rather than lecturing on the right answer, it explains the **Thought Trap** that lured the student into the chosen option.
* **Cognitive Dissonance:** Supplies a concrete paradox scenario forcing the flawed heuristic to collapse in under 30 seconds.
* **NEP 2020 Bilingual Reinforcement:** Delivers full dual-language support in English and Hindi/Hinglish for native conceptual retention.
* **Sub-Millisecond In-Memory Caching:** Identical wrong choices resolve in `<1ms` without redundant LLM queries or token spend.

### 3. 60-Second Remediation Bites
* Renders directly above practice sessions when bottleneck concepts are detected.
* Delivers:
  * **The Core Intuition:** 2 sentences establishing real-world justification.
  * **High-Contrast Analogy:** Real-world comparison (e.g., library card catalog vs. scanning every shelf).
  * **10-Second Dual-Language Anchor:** Compact heuristic formula.
  * **Conceptual Quick-Check:** Randomized, tricky conceptual challenge pool to verify intuition before re-entering MCQ quizzes.

### 4. Ebbinghaus Forgetting Curve & Decay-Aware Review
* Models retention decay over time: $R = e^{-t / S}$.
* Concepts with high decay flags (`isDue = true`) trigger targeted review questions drawn from **forward dependent concepts**, verifying practical retention rather than simple recall.

### 5. Teacher 1-Click AI Syllabus Ingestion & Cycle Prevention
* Ingests free-form course outlines, syllabi, or textbook chapters.
* Gemini synthesizes atomic concepts, dependency edges, and diagnostic questions in seconds.
* **Zero-Cycle Guarantee:** Integrates Kahn's topological sorting algorithm on the server to mathematically reject any cyclic dependency before committing to Postgres.

### 6. Offline Resilience & Auto-Sync
* Local storage queue records attempts and timestamped responses when internet connectivity drops.
* Seamless background reconciliation automatically updates mastery upon reconnection with zero duplicate attempts.

---

## 🏛️ System Architecture

```mermaid
graph TB
    subgraph ClientLayer["Frontend Client Layer (Next.js 16 • React 19 • PWA)"]
        UI["Modern Glassmorphism UI<br/>(Tailwind CSS v4 • Lucide Icons)"]
        DAG["Interactive DAG Map<br/>(@xyflow/react hardware-accelerated canvas)"]
        Offline["Offline Queue & Sync Engine<br/>(LocalStorage / IndexedDB with auto-sync)"]
    end

    subgraph ServerLayer["Server Core (Next.js App Router • Node.js)"]
        Auth["Auth & Identity Verification<br/>(Server-side sessions • Profile roles)"]
        Actions["Server Actions & API Routes<br/>(Strict Zod schema validation)"]
        GraphEngine["Graph Prerequisite Engine<br/>(BFS backtracking • Kahn's cycle prevention)"]
        MasteryEngine["Cognitive Mastery Engine<br/>(Scaled coverage • Ebbinghaus decay)"]
    end

    subgraph InfraLayer["Data & AI Infrastructure"]
        DB[("Supabase PostgreSQL 15<br/>• Row-Level Security (RLS)<br/>• Atomic transactions & zero drift<br/>• Idempotent relational schema")]
        AI["Google Gemini 2.5 Flash<br/>• Mental Mirror cognitive deconstruction<br/>• 60-sec bilingual concept bites<br/>• 1-Click syllabus DAG synthesis<br/>• Sub-ms in-memory cache"]
    end

    UI --> Actions
    DAG --> Actions
    Offline -.->|Reconcile on reconnect| Actions
    Actions --> Auth
    Auth --> GraphEngine
    Auth --> MasteryEngine
    GraphEngine <--> DB
    MasteryEngine <--> DB
    Actions <--> DB
    Actions <--> AI
```

---

## 📐 Mathematical Formulations & Algorithms

### 1. Question-Bank-Aware Scaled Mastery
Prevents grinding while ensuring high standards:
$$\text{Coverage} = \min\left(1, \frac{\text{Unique Questions Solved Correctly}}{\text{Total Available Questions for Concept}}\right)$$

$$\text{Accuracy} = \frac{\text{Total Correct Attempts}}{\text{Total Attempts}}$$

$$\text{Mastery Score} = \text{round}\Big(\text{Coverage} \times (80 + 20 \times \text{Accuracy})\Big)$$

| Score Range | Mastery Level | Educational Stage |
| :---: | :---: | :--- |
| **0 – 39%** | **Level 1 • Getting Started** | Initial exposure; prerequisite check recommended |
| **40 – 69%** | **Level 2 • Developing** | Partial bank completion or mixed consistency |
| **70 – 84%** | **Level 3 • Proficient** | Majority of questions solved with high accuracy |
| **85 – 100%** | **Level 4 • Mastered 🏆** | Full bank mastery with high precision |

### 2. Root Cause Candidate Ranking Heuristic
When a student struggles, prerequisite candidates are ranked to pinpoint the foundational blocker:
$$\text{Score} = 0.45 \cdot \text{Weakness} + 0.25 \cdot \text{EdgeWeight} + 0.20 \cdot \text{Evidence} + 0.10 \cdot \text{Recency}$$

* **Weakness:** Inverse of current mastery ($1 - \frac{\text{Mastery}}{100}$).
* **EdgeWeight:** Normalized dependency coupling factor ($w \in [0.1, 1.0]$).
* **Evidence:** Ratio of failed attempts on the prerequisite concept.
* **Recency:** Proximity of last practice activity.

### 3. Ebbinghaus Forgetting Curve Retention
$$R(t) = e^{-\frac{t}{S}}$$
Where:
* $t$ is elapsed days since last practice.
* $S$ is memory stability determined by mastery level ($S = \text{Mastery} \times 0.14$).
* If $R(t) < 0.60$, the concept is marked as `isDue = true`, prompting retention review.

---

## 🛠️ Technology Stack

| Layer | Framework / Tool | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Fullstack Framework** | **Next.js** | `16.3.4` (Turbopack) | Server Components, Streaming SSR, API Routes, Edge Routing |
| **Runtime & Core** | **Node.js** / **TypeScript** | `v20+` / `5.x Strict` | Strict type safety, 0 runtime type errors |
| **Database & Auth** | **Supabase** (PostgreSQL 15) | Latest | Relational schema, ACID compliance, Row-Level Security (RLS) |
| **AI Diagnosis & Synthesis** | **Google Gemini** | `2.5 Flash` | Sub-second cognitive analysis, bilingual synthesis, structured JSON |
| **Graph Visualization** | **@xyflow/react** | `12.4.x` | Hardware-accelerated interactive canvas DAG graph |
| **Schema Validation** | **Zod** | `3.24.x` | Strict input bounds, payload sanitization, AI schema validation |
| **Styling & Design System** | **Tailwind CSS + Vanilla CSS** | `v4.x` | Modern glassmorphism, responsive themes, accessible color palette |
| **Unit & Integration Tests** | **Vitest** | `5.0.x` | 101 automated unit, algorithm, and simulation tests |

---

## ⚡ Quick Start & Installation

### 1. Prerequisites
* **Node.js**: `v20.x` or higher (tested on Node v22)
* **npm**: `v10.x` or higher
* A free **Supabase** project ([supabase.com](https://supabase.com))
* A free **Google Gemini API Key** ([aistudio.google.com](https://aistudio.google.com/app/apikey))

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/learnpulse.git
cd learnpulse/learnpulse-app
npm install
```

### 3. Configure Environment Variables
Create your local environment configuration:
```bash
cp .env.local.example .env.local
```

Populate the required credentials in `.env.local`:
```env
# Supabase Project URL & Anon Public Key (Found in Supabase Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# Supabase Service Role Key (Used for server-side administrative tasks)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini API Key (Found in Google AI Studio)
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Database Setup & Migrations
1. Open your Supabase Dashboard -> **SQL Editor** -> **New Query**.
2. Run the migration script located at `supabase/schema.sql` to create all tables, indexes, triggers, and Row-Level Security policies.
3. *(Optional)* Run `supabase/fix_rls.sql` if you need to refresh policies.

### 5. Idempotent Data Seeding
Populate the database with complete computer science course graphs (DSA, OS, DBMS, CN, System Design), 190+ high-quality MCQs, and realistic student attempt histories:
```bash
node --env-file=.env.local scripts/seed.mjs
```

### 6. Launch Development Server
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Demo Accounts for Evaluators

The database seeder provisions realistic demo accounts with diverse learning trajectories:

| Role | Email | Password | Persona & Pedagogical State |
| :--- | :--- | :--- | :--- |
| **Teacher** | `teacher@demo.learnpulse.dev` | `Demo@12345` | Course author, cohort analytics, class-wide bottleneck visualizer |
| **Student (Priya)** | `priya@demo.learnpulse.dev` | `Demo@12345` | High achiever with targeted gap in *Database Normalization* & *Indexing* |
| **Student (Rohit)** | `rohit@demo.learnpulse.dev` | `Demo@12345` | Struggling learner with bottleneck in foundational *Arrays & Pointers* |
| **Student (Ananya)** | `ananya@demo.learnpulse.dev` | `Demo@12345` | Solid fundamentals across OS and Networks |
| **Student (Karthik)** | `karthik@demo.learnpulse.dev` | `Demo@12345` | At-risk student requiring memory management intervention |
| **Student (Divya)** | `divya@demo.learnpulse.dev` | `Demo@12345` | Consistent mid-tier student progressing across multiple courses |
| **Student (Siddharth)** | `siddharth@demo.learnpulse.dev` | `Demo@12345` | Advanced student reviewing Cloud & Distributed Systems |

---

## 🔌 API Reference & Route Specifications

### `POST /api/diagnose`
Analyzes a student's gap on a target concept and executes root-cause backtracking.
* **Payload:** `{ targetConceptId: UUID, targetConceptName: string, targetMastery: number, prerequisites: Array }`
* **Response:** `{ rootCause: string, blockingConceptId: UUID, confidence: number, explanation: string, actionPlan: Array }`

### `POST /api/submit-attempt`
Submits an MCQ answer, updates the student attempt history, calculates scaled mastery, and detects retention decay.
* **Payload:** `{ questionId: UUID, conceptId: UUID, selectedAnswer: string, isReviewQuestion?: boolean }`
* **Response:** `{ isCorrect: boolean, previousScore: number, newScore: number, gain: number, isConceptCompleted: boolean }`

### `POST /api/ai/misconception`
Reverse-engineers the student's false mental model for a chosen distractor option.
* **Payload:** `{ questionId: UUID, questionText: string, selectedOptionText: string, correctOptionText: string, conceptName: string }`
* **Response:** `{ thoughtTrap: string, mentalAnchor: string, vernacularAnchor: string, cognitiveDissonance: Object, cached: boolean }`

### `POST /api/ai/concept-bite`
Retrieves or generates a 60-second recovery bite with a tricky interactive conceptual question pool.
* **Payload:** `{ conceptId: UUID, conceptName: string, description?: string, challengeIndex?: number }`
* **Response:** `{ intuition: string, analogy: string, anchorEn: string, anchorHi: string, quickCheck: Object, challengePool: Array }`

---

## 🧪 Automated Testing & Quality Assurance

LearnPulse maintains 100% test pass rates across 11 test suites:

```bash
npm run test:run
```

```
Test Files  11 passed (11)
     Tests  101 passed (101)
  Duration  538ms

 ✓ src/lib/offline/__tests__/offlineQueue.test.ts (5 tests)
 ✓ src/lib/algorithms/__tests__/graph.test.ts (15 tests)
 ✓ src/lib/algorithms/__tests__/mastery.test.ts (15 tests)
 ✓ src/lib/algorithms/__tests__/decay.test.ts (11 tests)
 ✓ src/lib/algorithms/__tests__/risk.test.ts (15 tests)
 ✓ src/lib/algorithms/__tests__/rootCause.test.ts (9 tests)
 ✓ src/lib/ai/__tests__/misconception.test.ts (5 tests)
 ✓ src/lib/ai/__tests__/dagSynthesis.test.ts (7 tests)
 ✓ src/lib/ai/__tests__/conceptBite.test.ts (5 tests)
 ✓ src/lib/__tests__/masteryLevels.test.ts (9 tests)
 ✓ src/lib/algorithms/__tests__/reviewSelection.test.ts (5 tests)
```

### Static Analysis & Verification Commands
```bash
# Run ESLint (Strict zero-warning policy)
npm run lint

# TypeScript Strict Typecheck (Zero emit errors)
npx tsc --noEmit

# Production Build Verification (Turbopack optimized bundle)
npm run build
```

---

## 🔒 Security, Privacy & ACID Integrity

1. **Row-Level Security (RLS):** All Postgres tables implement explicit policies restricting student queries exclusively to their own UUID records.
2. **Internal Error Masking:** Database error codes, PostgreSQL constraints, and file paths are never surfaced to clients. All client errors return sanitized, human-friendly messages while logging full exceptions server-side.
3. **Secret Hygiene:** 0 API keys, service role tokens, or credentials are leaked in client bundles or git history.
4. **ACID Properties & Idempotency:** Mastery re-calculations, attempt insertions, and intervention records execute with database consistency (`onConflict` upserts, zero duplicate records, verified zero score drift).

---

## 📂 Project Directory Structure

```
learnpulse-app/
├── public/                       # Static visual assets, brand icons
├── scripts/                      # Verified database utility scripts
│   ├── seed.mjs                  # Idempotent database seeder (5 courses, 190+ questions)
│   ├── sync_mastery_scores.mjs   # Mastery score database synchronization
│   ├── test_misconception_api.mjs# Mental Mirror endpoint test
│   └── test_teacher_authoring_loop.mjs # Authoring lifecycle verification
├── src/
│   ├── app/                      # Next.js 16 App Router
│   │   ├── (auth)/               # Login & Signup flows
│   │   ├── actions/authoring.ts  # Server Actions for Course, Concept & Question authoring
│   │   ├── api/                  # RESTful endpoints (diagnose, submit-attempt, ai/*)
│   │   ├── dashboard/            # Student learning portal (Gaps, Practice, Overview)
│   │   └── teacher/              # Teacher portal (Cohort analytics, DAG authoring)
│   ├── components/               # Modular UI architecture
│   │   ├── layout/               # Header, Sidebar, Application Shell
│   │   ├── mastery/              # InteractiveDagGraph, ConceptChain, MasteryBar
│   │   ├── practice/             # QuizCard (Mental Mirror, Cognitive Dissonance)
│   │   ├── remediation/          # ConceptBiteCard (60-Sec bilingual bites)
│   │   └── teacher/              # SyllabusIngestionModal, Cohort view
│   ├── lib/
│   │   ├── ai/                   # Gemini client, prompt templates, Zod schemas
│   │   ├── algorithms/           # Graph BFS, Kahn's TopoSort, Scaled Mastery, Decay
│   │   └── offline/              # Offline queue & automatic sync engine
│   └── utils/
│       └── supabase/             # Server & browser SSR client creators
├── supabase/                     # SQL schemas, migrations & question banks
├── .env.local.example            # Environment configuration template
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## 📄 License & Acknowledgments

Developed with ❤️ for **Smart India Hackathon (SIH 2026)** — Problem Statement **SIH 26207**.  
Engineered to bring true cognitive diagnostics and equitable, adaptive remediation to learners nationwide.
