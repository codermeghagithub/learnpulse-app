// Deterministic offline fallbacks and curriculum fixture dictionaries

import type {
  DiagnosisInput,
  DiagnosisOutput,
  MisconceptionOutput,
  DagSynthesisOutput,
  ConceptBiteOutput,
  BilingualChallenge,
} from "./schemas";

export function buildDeterministicDiagnosisFallback(input: DiagnosisInput): DiagnosisOutput {
  const topPrereq = input.prerequisites[0];
  const blockingConcept = topPrereq?.concept ?? input.targetConcept;

  return {
    rootCause: `Insufficient mastery of ${blockingConcept} is blocking progress on ${input.targetConcept}.`,
    blockingConcept,
    confidence: 0.6,
    explanation: `Based on your attempt history, ${blockingConcept} (${topPrereq?.mastery?.toFixed(0) ?? 0}% mastery) appears to be the primary prerequisite gap. Strengthening this foundation will help you understand ${input.targetConcept} more effectively.`,
    actionPlan: [
      {
        title: `Review ${blockingConcept} fundamentals`,
        description: `Go through the core concepts of ${blockingConcept}, focusing on examples you previously got wrong.`,
        estimatedMinutes: 20,
      },
      {
        title: `Practice ${blockingConcept} problems`,
        description: `Complete 5–10 practice problems on ${blockingConcept} until you feel confident.`,
        estimatedMinutes: 30,
      },
      {
        title: `Bridge to ${input.targetConcept}`,
        description: `Work through problems that explicitly use ${blockingConcept} as a foundation for ${input.targetConcept}.`,
        estimatedMinutes: 25,
      },
    ],
  };
}


export function buildDeterministicMisconceptionFallback(input: {
  selectedOptionText: string;
  correctOptionText: string;
  conceptName: string;
}): MisconceptionOutput {
  const enThoughtTrap = `You likely selected "${input.selectedOptionText}" because both options share closely related terminology within ${input.conceptName}. However, "${input.selectedOptionText}" describes a different operational phase than "${input.correctOptionText}".`;
  const enMentalAnchor = `Rule of thumb: Focus on the specific responsibility of ${input.conceptName} — ask yourself what the component does, not just where it lives.`;
  const enParadox = `Imagine applying your assumption in a real system: if "${input.selectedOptionText}" and "${input.correctOptionText}" were interchangeable, swapping them would produce the same output. But in practice, they handle fundamentally different responsibilities — swapping them would cause the system to fail.`;
  const enCounterQ = `If your assumption held, what specific output or behaviour would change if you replaced "${input.correctOptionText}" with "${input.selectedOptionText}" in a live system?`;

  const hiThoughtTrap = `आपने संभवतः "${input.selectedOptionText}" इसलिए चुना क्योंकि दोनों विकल्प ${input.conceptName} से गहराई से जुड़े हैं। लेकिन "${input.selectedOptionText}" और "${input.correctOptionText}" के काम करने का चरण और ज़िम्मेदारी पूरी तरह अलग है।`;
  const hiMentalAnchor = `याद रखें: ${input.conceptName} में दोनों विकल्पों के काम अलग हैं — हमेशा देखें कि कौन काम शुरू करता है और कौन डेटा प्रोसेस करता है।`;
  const hiParadox = `कल्पना करें कि अगर आप इसे एक लाइव सिस्टम में लागू करें: यदि "${input.selectedOptionText}" और "${input.correctOptionText}" एक समान होते, तो उन्हें आपस में बदलने पर भी सिस्टम सही चलता। लेकिन असल में ऐसा करने पर सिस्टम तुरंत क्रैश या गलत परिणाम देगा।`;
  const hiCounterQ = `यदि आपकी धारणा सही होती, तो लाइव प्रोडक्शन में "${input.correctOptionText}" की जगह "${input.selectedOptionText}" लगाने पर क्या परिणाम आता?`;

  return {
    thoughtTrap: enThoughtTrap,
    mentalAnchor: enMentalAnchor,
    vernacularAnchor: hiMentalAnchor,
    cognitiveDissonance: {
      paradoxScenario: enParadox,
      counterQuestion: enCounterQ,
    },
    en: {
      thoughtTrap: enThoughtTrap,
      mentalAnchor: enMentalAnchor,
      cognitiveDissonance: {
        paradoxScenario: enParadox,
        counterQuestion: enCounterQ,
      },
    },
    hi: {
      thoughtTrap: hiThoughtTrap,
      mentalAnchor: hiMentalAnchor,
      cognitiveDissonance: {
        paradoxScenario: hiParadox,
        counterQuestion: hiCounterQ,
      },
    },
  };
}


export function buildDeterministicDagFallback(
  topicText: string,
  explicitCourseTitle?: string
): DagSynthesisOutput {
  let title = explicitCourseTitle?.trim();
  if (!title) {
    const fullText = topicText.toLowerCase();
    const firstLine = topicText.split("\n")[0] ?? "";
    const prefix = firstLine.split(":")[0]?.trim() || "";

    if (
      fullText.includes("artificial") ||
      fullText.includes("machine learning") ||
      fullText.includes("heuristics") ||
      fullText.includes("minimax") ||
      fullText.includes("state space") ||
      fullText.includes(" ai")
    ) {
      title = "Artificial Intelligence";
    } else if (
      fullText.includes("data mining") ||
      fullText.includes("warehous") ||
      fullText.includes("olap") ||
      fullText.includes("apriori")
    ) {
      title = "Data Mining and Warehousing";
    } else if (
      fullText.includes("data structure") ||
      fullText.includes("algorithm") ||
      fullText.includes("dsa") ||
      fullText.includes("binary tree") ||
      fullText.includes("linked list")
    ) {
      title = "Data Structures and Algorithms";
    } else if (
      fullText.includes("deadlock") ||
      fullText.includes("operating system") ||
      fullText.includes("semaphore") ||
      fullText.includes(" os")
    ) {
      title = "Operating Systems";
    } else if (
      fullText.includes("normaliz") ||
      fullText.includes("dbms") ||
      fullText.includes("database") ||
      fullText.includes("sql")
    ) {
      title = "Database Management Systems";
    } else if (
      fullText.includes("tcp") ||
      fullText.includes("network") ||
      fullText.includes("ip ") ||
      fullText.includes("subnet")
    ) {
      title = "Computer Networks";
    } else {
      title = prefix.slice(0, 60) || "Computer Science Course";
    }
  }

  // Pre-configured curricular concepts for standard academic subjects
  const lowerTitle = title.toLowerCase();
  let concepts: DagSynthesisOutput["concepts"] = [
    { name: "Foundational Principles & Theory", description: `Fundamental theories and models of ${title}.`, difficulty: "easy" },
    { name: "Core Architecture & Data Flow", description: `Primary operational frameworks and data pathways in ${title}.`, difficulty: "easy" },
    { name: "Methodologies & Algorithms", description: `Key computational algorithms and workflows used in ${title}.`, difficulty: "medium" },
    { name: "Implementation & Practical Patterns", description: `Concrete implementation architectures and component interactions in ${title}.`, difficulty: "medium" },
    { name: "System Optimization & Scaling", description: `Performance bottlenecks, profiling, and optimization techniques in ${title}.`, difficulty: "hard" },
    { name: "Advanced Applications & Edge Cases", description: `Complex problem solving, failure mode mitigation, and synthesis in ${title}.`, difficulty: "hard" },
  ];

  let customEdges: DagSynthesisOutput["edges"] = [];

  if (
    lowerTitle.includes("data structure") ||
    lowerTitle.includes("algorithm") ||
    lowerTitle.includes("dsa")
  ) {
    concepts = [
      { name: "Asymptotic Analysis & Arrays", description: "Time and space complexity (Big-O, Omega, Theta), array memory layout, and two-pointer techniques.", difficulty: "easy" },
      { name: "Linear Structures: Stacks & Queues", description: "LIFO stack operations, FIFO queue buffering, and monotonic stack/queue patterns.", difficulty: "easy" },
      { name: "Linked Lists & Pointer Manipulation", description: "Singly and doubly linked lists, pointer rewiring, and cycle detection.", difficulty: "easy" },
      { name: "Recursion & Backtracking", description: "Call stack mechanics, base conditions, state restoration, and permutation/subset search.", difficulty: "medium" },
      { name: "Binary Trees & BSTs", description: "Tree traversals (inorder, preorder, postorder, BFS), and Binary Search Tree ordering invariants.", difficulty: "medium" },
      { name: "Priority Queues & Binary Heaps", description: "Min/max heap properties, array representations, sift-up/down operations, and top-K elements.", difficulty: "medium" },
      { name: "Hashing & Hash Tables", description: "Hash functions, collision handling (chaining, open addressing), and average O(1) key lookups.", difficulty: "medium" },
      { name: "Graph Representations & Traversals", description: "Adjacency lists and matrices, Breadth-First Search (BFS), and Depth-First Search (DFS).", difficulty: "hard" },
      { name: "Shortest Path & Greedy Algorithms", description: "Greedy choice properties, Dijkstra's single-source shortest path, and minimum spanning trees.", difficulty: "hard" },
      { name: "Dynamic Programming Foundations", description: "Optimal substructure, overlapping subproblems, memoization vs tabulation, and state transitions.", difficulty: "hard" },
    ];

    customEdges = [
      { prerequisiteName: "Asymptotic Analysis & Arrays", conceptName: "Linear Structures: Stacks & Queues", weight: 1.0 },
      { prerequisiteName: "Asymptotic Analysis & Arrays", conceptName: "Linked Lists & Pointer Manipulation", weight: 1.0 },
      { prerequisiteName: "Asymptotic Analysis & Arrays", conceptName: "Recursion & Backtracking", weight: 0.9 },
      { prerequisiteName: "Linked Lists & Pointer Manipulation", conceptName: "Binary Trees & BSTs", weight: 1.0 },
      { prerequisiteName: "Recursion & Backtracking", conceptName: "Binary Trees & BSTs", weight: 0.9 },
      { prerequisiteName: "Binary Trees & BSTs", conceptName: "Priority Queues & Binary Heaps", weight: 0.8 },
      { prerequisiteName: "Asymptotic Analysis & Arrays", conceptName: "Hashing & Hash Tables", weight: 0.9 },
      { prerequisiteName: "Linear Structures: Stacks & Queues", conceptName: "Graph Representations & Traversals", weight: 0.9 },
      { prerequisiteName: "Recursion & Backtracking", conceptName: "Graph Representations & Traversals", weight: 0.9 },
      { prerequisiteName: "Graph Representations & Traversals", conceptName: "Shortest Path & Greedy Algorithms", weight: 1.0 },
      { prerequisiteName: "Recursion & Backtracking", conceptName: "Dynamic Programming Foundations", weight: 1.0 },
    ];
  } else if (lowerTitle.includes("artificial intelligence")) {
    concepts = [
      { name: "State Space Search & Heuristics", description: "Informed and uninformed search algorithms, A* search, and heuristic design.", difficulty: "easy" },
      { name: "Knowledge Representation & Logic", description: "Propositional and first-order predicate logic for automated reasoning.", difficulty: "easy" },
      { name: "Adversarial Search & Games", description: "Minimax search, alpha-beta pruning, and evaluation heuristics in game playing.", difficulty: "medium" },
      { name: "Constraint Satisfaction Problems", description: "Constraint propagation, backtracking with forward checking, and arc consistency.", difficulty: "medium" },
      { name: "Machine Learning Foundations", description: "Supervised vs unsupervised learning, loss functions, and gradient descent optimization.", difficulty: "hard" },
      { name: "Neural Networks & Deep Learning", description: "Multilayer perceptrons, backpropagation, activation functions, and regularization.", difficulty: "hard" },
    ];

    customEdges = [
      { prerequisiteName: "State Space Search & Heuristics", conceptName: "Adversarial Search & Games", weight: 1.0 },
      { prerequisiteName: "State Space Search & Heuristics", conceptName: "Constraint Satisfaction Problems", weight: 0.9 },
      { prerequisiteName: "Knowledge Representation & Logic", conceptName: "Constraint Satisfaction Problems", weight: 0.8 },
      { prerequisiteName: "State Space Search & Heuristics", conceptName: "Machine Learning Foundations", weight: 0.7 },
      { prerequisiteName: "Machine Learning Foundations", conceptName: "Neural Networks & Deep Learning", weight: 1.0 },
    ];
  } else if (lowerTitle.includes("operating systems")) {
    concepts = [
      { name: "Process Management & Scheduling", description: "Process lifecycles, context switching, and CPU scheduling algorithms (FCFS, SJF, RR).", difficulty: "easy" },
      { name: "Threads & Concurrency", description: "Kernel vs user threads, multi-threading architectures, and race conditions.", difficulty: "easy" },
      { name: "Synchronization & Classical Problems", description: "Critical sections, mutex locks, semaphores, and monitor synchronization.", difficulty: "medium" },
      { name: "Deadlock Detection & Avoidance", description: "Deadlock conditions, resource allocation graphs, and Banker's algorithm.", difficulty: "medium" },
      { name: "Memory Management & Paging", description: "Address translation, contiguous allocation, paging, segmentation, and TLBs.", difficulty: "medium" },
      { name: "Virtual Memory & Page Replacement", description: "Demand paging, page fault handling, and page replacement policies (FIFO, LRU).", difficulty: "hard" },
      { name: "File Systems & Storage Management", description: "File allocation methods, directory structures, inode mechanisms, and disk scheduling.", difficulty: "hard" },
    ];

    customEdges = [
      { prerequisiteName: "Process Management & Scheduling", conceptName: "Threads & Concurrency", weight: 1.0 },
      { prerequisiteName: "Threads & Concurrency", conceptName: "Synchronization & Classical Problems", weight: 1.0 },
      { prerequisiteName: "Synchronization & Classical Problems", conceptName: "Deadlock Detection & Avoidance", weight: 1.0 },
      { prerequisiteName: "Process Management & Scheduling", conceptName: "Memory Management & Paging", weight: 0.9 },
      { prerequisiteName: "Memory Management & Paging", conceptName: "Virtual Memory & Page Replacement", weight: 1.0 },
      { prerequisiteName: "Memory Management & Paging", conceptName: "File Systems & Storage Management", weight: 0.8 },
    ];
  } else if (lowerTitle.includes("database") || lowerTitle.includes("dbms") || lowerTitle.includes("sql")) {
    concepts = [
      { name: "Relational Data Model & Keys", description: "Entity-relationship diagrams, relations, primary/foreign keys, and integrity constraints.", difficulty: "easy" },
      { name: "SQL Querying & Aggregations", description: "Data definition, joins, nested subqueries, grouping, and set operations.", difficulty: "easy" },
      { name: "Functional Dependencies & Normalization", description: "Lossless join decomposition, 1NF, 2NF, 3NF, and BCNF normal forms.", difficulty: "medium" },
      { name: "Transactions & ACID Guarantees", description: "Atomicity, consistency, isolation, durability, and serializability schedules.", difficulty: "medium" },
      { name: "Concurrency Control & Locking", description: "Two-phase locking (2PL), deadlock prevention, and timestamp ordering protocols.", difficulty: "hard" },
      { name: "Indexing & B+ Trees", description: "Clustered and non-clustered indexes, B-tree/B+ tree node splits, and hash indexing.", difficulty: "hard" },
    ];

    customEdges = [
      { prerequisiteName: "Relational Data Model & Keys", conceptName: "SQL Querying & Aggregations", weight: 1.0 },
      { prerequisiteName: "Relational Data Model & Keys", conceptName: "Functional Dependencies & Normalization", weight: 1.0 },
      { prerequisiteName: "SQL Querying & Aggregations", conceptName: "Transactions & ACID Guarantees", weight: 0.9 },
      { prerequisiteName: "Transactions & ACID Guarantees", conceptName: "Concurrency Control & Locking", weight: 1.0 },
      { prerequisiteName: "Relational Data Model & Keys", conceptName: "Indexing & B+ Trees", weight: 0.8 },
    ];
  }

  // Generate tough, real-world, out-of-the-box questions for EACH concept
  const questions: DagSynthesisOutput["questions"] = [];

  for (const c of concepts) {
    const cLower = c.name.toLowerCase();

    // Specific tricky scenario questions tailored to core engineering concepts
    if (cLower.includes("asymptotic") || cLower.includes("array")) {
      questions.push({
        conceptName: c.name,
        questionText: "An ultra-low-latency financial engine switches from a hash table with O(1) average lookup to a contiguous sorted array with O(log N) binary search for 5,000 tickers. Profiling reveals binary search executes 3x faster in production. Why does this counter-intuitive result occur on modern hardware?",
        options: [
          { key: "A" as const, text: "Contiguous arrays maximize CPU L1/L2 cache line spatial locality and hardware prefetching, avoiding pointer-chasing cache misses." },
          { key: "B" as const, text: "Binary search algorithms bypass operating system kernel scheduling queues entirely." },
          { key: "C" as const, text: "Hash functions strictly consume quadratic O(N^2) cycles once the dataset exceeds 1,000 entries." },
          { key: "D" as const, text: "Modern production compilers automatically convert binary search into direct branchless constant-time opcodes." },
        ],
        correctAnswer: "A" as const,
        explanation: "Hardware cache lines (typically 64 bytes) fetch adjacent array elements ahead of time. Node-based hash maps scatter memory across the heap, incurring multiple high-latency RAM roundtrips (100–200 CPU cycles per cache miss).",
        difficulty: "easy" as const,
      });

      questions.push({
        conceptName: c.name,
        questionText: "A dynamic array resizes by doubling capacity at 100% full, but immediately halves capacity when occupancy drops below 50%. An adversary sends an alternating stream of push() and pop() requests exactly at the capacity threshold. What is the worst-case per-operation time complexity under this workload?",
        options: [
          { key: "A" as const, text: "O(N) per operation because every consecutive operation triggers a complete array reallocation and element copy (thrashing)." },
          { key: "B" as const, text: "Amortized O(1) because the operating system page cache absorbs successive allocations without physical memory movement." },
          { key: "C" as const, text: "Strictly O(log N) as the heap manager maintains balanced buddy-allocation blocks." },
          { key: "D" as const, text: "O(1) because pop() operations merely decrement the size counter without altering physical buffer bounds." },
        ],
        correctAnswer: "A" as const,
        explanation: "Immediate shrinking causes memory thrashing: push() allocates 2N space and copies N items; the next pop() allocates N space and copies N items. Production systems use hysteresis (e.g. shrink only when dropping below 25% capacity).",
        difficulty: "hard" as const,
      });
    } else if (cLower.includes("stack") || cLower.includes("queue")) {
      questions.push({
        conceptName: c.name,
        questionText: "A high-throughput telemetry service processes an unbounded real-time stream of incoming sensor readings using a monotonic stack. If incoming values arrive in strictly increasing order (v1 < v2 < ... < vn), how many total stack push and pop operations are performed across the entire stream of N items?",
        options: [
          { key: "A" as const, text: "Exactly N pushes and 0 pops during the stream, maintaining linear O(N) aggregate processing time." },
          { key: "B" as const, text: "O(N^2) total operations because every element forces a complete linear traversal of the stack buffer." },
          { key: "C" as const, text: "O(N log N) operations because monotonic ordering requires binary search repositioning on each insert." },
          { key: "D" as const, text: "Zero operations because monotonic stacks reject pre-sorted streaming data." },
        ],
        correctAnswer: "A" as const,
        explanation: "In a monotonic decreasing stack, strictly increasing elements pop everything. In a monotonic increasing stack, they simply push. In all cases, each element is pushed at most once and popped at most once, guaranteeing strict amortized O(1) per element.",
        difficulty: "medium" as const,
      });

      questions.push({
        conceptName: c.name,
        questionText: "You implement a FIFO queue using two LIFO stacks (Inbox and Outbox). A junior engineer notices that a single dequeue operation can take O(N) worst-case time. Under what exact condition will this O(N) latency spike occur?",
        options: [
          { key: "A" as const, text: "When Outbox is empty and an incoming dequeue request forces pouring all N accumulated elements from Inbox to Outbox." },
          { key: "B" as const, text: "Whenever both stacks hold an odd number of elements." },
          { key: "C" as const, text: "On every single dequeue operation because elements must be flipped on both ends." },
          { key: "D" as const, text: "Only when physical RAM exhaustion forces swap memory paging." },
        ],
        correctAnswer: "A" as const,
        explanation: "Elements are poured into Outbox only when Outbox is completely empty. Although that single dequeue takes O(N) time, the next N-1 dequeues take O(1), preserving amortized O(1) per operation.",
        difficulty: "hard" as const,
      });
    } else if (cLower.includes("tree") || cLower.includes("bst")) {
      questions.push({
        conceptName: c.name,
        questionText: "A database query planner constructs an in-memory Binary Search Tree from customer transaction records sorted chronologically by timestamp. The team notices query response times degrade from 1ms to 250ms. What mathematical degeneration occurred, and what invariant guarantees an AVL or Red-Black tree solves it?",
        options: [
          { key: "A" as const, text: "Inserting sorted keys degenerates the BST into a linked list of height N (O(N) search); height-balancing bounds maximum tree height to O(log N)." },
          { key: "B" as const, text: "Inserting sorted keys causes hash collisions at the root node, overflowing the tree's bucket array." },
          { key: "C" as const, text: "BSTs cannot represent temporal timestamps without floating-point rounding errors." },
          { key: "D" as const, text: "The tree depth exceeds the 32-bit integer address range, corrupting the left-child pointer table." },
        ],
        correctAnswer: "A" as const,
        explanation: "Sorted data creates a degenerate 'skewed' tree with zero left children. AVL trees enforce a balance factor (-1, 0, 1), guaranteeing height <= 1.44 log2 N via tree rotations.",
        difficulty: "medium" as const,
      });

      questions.push({
        conceptName: c.name,
        questionText: "Consider ANY strictly full binary tree where every internal node has exactly 2 non-null children. If the tree contains exactly L leaf nodes, how many internal nodes I must it have, regardless of whether it is perfectly balanced or pathologically skewed?",
        options: [
          { key: "A" as const, text: "I = L - 1 (proven by induction: every 2-child fork introduces 1 internal node and increases the net leaf count by 1)." },
          { key: "B" as const, text: "I = 2L in balanced trees, but I = L in skewed trees." },
          { key: "C" as const, text: "I = floor(log2 L) dependent on the tree's maximum depth." },
          { key: "D" as const, text: "I = L + 1 because the root node contributes an extra level." },
        ],
        correctAnswer: "A" as const,
        explanation: "In any full binary tree with L leaves, the number of internal nodes is strictly invariant: I = L - 1. Tree balance affects height, not node counts.",
        difficulty: "hard" as const,
      });
    } else if (cLower.includes("dynamic programming") || cLower.includes("greedy")) {
      questions.push({
        conceptName: c.name,
        questionText: "Why does Dijkstra's greedy shortest-path algorithm catastrophically fail on graphs containing negative edge weights, whereas the Bellman-Ford dynamic programming approach handles them correctly?",
        options: [
          { key: "A" as const, text: "Dijkstra assumes optimal substructure is monotonic (once a node is settled, its distance can never decrease), an invariant broken by negative weights." },
          { key: "B" as const, text: "Dijkstra's priority queue cannot store signed integer bit-representations." },
          { key: "C" as const, text: "Negative edges cause integer overflow inside the relaxation step." },
          { key: "D" as const, text: "Dijkstra's algorithm converts directed graphs into undirected minimum spanning trees." },
        ],
        correctAnswer: "A" as const,
        explanation: "Dijkstra's greedy choice property relies on non-negative weights: adding an edge can only increase or maintain path cost. A negative edge allows a roundabout path to end up cheaper, which Dijkstra never revisits.",
        difficulty: "hard" as const,
      });

      questions.push({
        conceptName: c.name,
        questionText: "In the 0/1 Knapsack problem (items cannot be cut into fractions), a greedy algorithm that picks items with the highest value-to-weight ratio fails to guarantee an optimal solution. Why does greedy fail here but succeed on Fractional Knapsack?",
        options: [
          { key: "A" as const, text: "Greedy choices leave indivisible empty capacity ('slack') that a combination of lower-density items could fill more profitably; DP explores these capacity subproblems." },
          { key: "B" as const, text: "0/1 Knapsack has no overlapping subproblems, making dynamic programming the only valid polynomial-time method." },
          { key: "C" as const, text: "Fractional Knapsack relies on non-deterministic Turing machines to approximate optimal ratios." },
          { key: "D" as const, text: "0/1 Knapsack cannot be solved using array memoization tables." },
        ],
        correctAnswer: "A" as const,
        explanation: "In 0/1 knapsack, selecting a bulky item with high ratio might leave empty space that cannot be filled. Fractional knapsack allows filling the remaining sliver with partial items, maintaining the greedy invariant.",
        difficulty: "medium" as const,
      });
    } else if (cLower.includes("hash")) {
      questions.push({
        conceptName: c.name,
        questionText: "A production microservice experiences a Denial-of-Service (DoS) where CPU utilization spikes to 100% processing tiny 50 KB JSON payloads. Security analysis confirms an algorithmic Hash Collision Attack. How does this attack degrade the system, and what is the modern remedy?",
        options: [
          { key: "A" as const, text: "The attacker crafts keys that generate identical hash codes, collapsing O(1) lookups into worst-case O(N) linked-list traversals; runtimes mitigate this with SipHash and randomized per-process seeds." },
          { key: "B" as const, text: "The attacker floods memory with null pointers, causing kernel TLB shootdowns across all CPU cores." },
          { key: "C" as const, text: "The hash table runs out of prime modulus buckets, entering an infinite loop inside the modulo operator." },
          { key: "D" as const, text: "The hash function consumes cryptographic SHA-512 rounds on every incoming request parameter." },
        ],
        correctAnswer: "A" as const,
        explanation: "If hash functions are deterministic and unkeyed (e.g. MurmurHash or polynomial hashes), adversaries generate precomputed collisions. SipHash uses a secret random key generated at process startup.",
        difficulty: "hard" as const,
      });

      questions.push({
        conceptName: c.name,
        questionText: "In a hash table utilizing open addressing with linear probing, the load factor reaches 0.90. What critical performance degradation occurs, and why is tombstones deletion necessary?",
        options: [
          { key: "A" as const, text: "Primary clustering forms long contiguous occupied runs; naive deletion without tombstones breaks the probe sequence for subsequently inserted keys." },
          { key: "B" as const, text: "Linear probing creates duplicate keys at index 0, corrupting table metadata." },
          { key: "C" as const, text: "Open addressing switches to quadratic probing once load factor crosses 0.75." },
          { key: "D" as const, text: "The hash table locks all reads until elements are re-sorted alphabetically." },
        ],
        correctAnswer: "A" as const,
        explanation: "When searching for an element, linear probing stops at the first empty slot. If an intermediate key is deleted and set to empty, subsequent searches terminate prematurely without finding the target.",
        difficulty: "medium" as const,
      });
    } else if (cLower.includes("graph") || cLower.includes("network")) {
      questions.push({
        conceptName: c.name,
        questionText: "In a social network graph with 2,000,000 users where each user averages 400 friends, running standard BFS to find degree-3 connection paths crashes with Out-Of-Memory (OOM). Why does bidirectional BFS avoid this memory explosion?",
        options: [
          { key: "A" as const, text: "Standard BFS explores b^d = 400^3 ≈ 64,000,000 frontier nodes; bidirectional BFS searches from both ends simultaneously, reducing frontier memory to 2 * b^(d/2) ≈ 2 * 400^1.5 ≈ 16,000 nodes." },
          { key: "B" as const, text: "Bidirectional BFS replaces the adjacency list with an adjacency matrix that uses 0 bytes of RAM." },
          { key: "C" as const, text: "Standard BFS creates memory leaks in the operating system thread pool that bidirectional BFS cleans up." },
          { key: "D" as const, text: "Bidirectional BFS eliminates all cycles without maintaining a visited set." },
        ],
        correctAnswer: "A" as const,
        explanation: "The exponential frontier in BFS grows as O(b^d). Meeting in the middle reduces the maximum exponent from d to d/2, cutting required frontier storage by several orders of magnitude.",
        difficulty: "hard" as const,
      });

      questions.push({
        conceptName: c.name,
        questionText: "You need to detect cycles in a directed graph representing package build dependencies. An engineer attempts to use BFS without in-degree counting, while another proposes Kahn's algorithm. Why does naive BFS fail to detect cycles in directed graphs?",
        options: [
          { key: "A" as const, text: "A directed cycle can be entered from multiple nodes, so BFS cross-edges do not necessarily indicate cycles; Kahn's algorithm tracks in-degrees to detect remaining unprocessed dependencies." },
          { key: "B" as const, text: "BFS can only be executed on undirected trees, not directed graphs." },
          { key: "C" as const, text: "Kahn's algorithm uses depth-first backtracking to mark nodes as currently visited." },
          { key: "D" as const, text: "Directed graphs cannot be stored using adjacency lists." },
        ],
        correctAnswer: "A" as const,
        explanation: "In a directed graph, finding an already visited node does NOT imply a cycle (it could be a forward or cross-edge). Kahn's algorithm removes nodes with 0 in-degrees; if nodes remain, a directed cycle exists.",
        difficulty: "medium" as const,
      });
    } else {
      // Dynamic, highly rigorous scenario questions for all other concepts
      questions.push({
        conceptName: c.name,
        questionText: `A mission-critical distributed platform relies on "${c.name}" within ${title}. Under sudden 10x burst load, the system experiences cascading latency spikes. An architecture review identifies that a hidden invariant of "${c.name}" was violated. Which failure mode is the root cause?`,
        options: [
          { key: "A" as const, text: `The operational assumptions of "${c.name}" break down under high contention, causing resource thrashing and unamortized latency spikes.` },
          { key: "B" as const, text: "The network socket buffer resets all active TCP handshakes to synchronous polling mode." },
          { key: "C" as const, text: "The algorithm assumes infinite L1 cache capacity, causing kernel panic interrupts." },
          { key: "D" as const, text: "Static code analyzers enforce immutable execution, preventing runtime parameter adjustments." },
        ],
        correctAnswer: "A" as const,
        explanation: `Under extreme load, systems using "${c.name}" must account for contention and queue buildup. When invariant assumptions are breached, amortized efficiency degrades to worst-case behavior.`,
        difficulty: "medium" as const,
      });

      questions.push({
        conceptName: c.name,
        questionText: `When optimizing "${c.name}" in production, an engineer proposes an out-of-the-box shortcut to eliminate intermediate synchronization overhead. What subtle trade-off makes this shortcut hazardous in safety-critical environments?`,
        options: [
          { key: "A" as const, text: "It introduces race conditions and non-deterministic state corruption under concurrent or interleaved execution." },
          { key: "B" as const, text: "It doubles physical silicon transistor wear across multi-core processors." },
          { key: "C" as const, text: "It strictly forces the database storage engine to revert to serializable isolation." },
          { key: "D" as const, text: "It invalidates all cryptographic public keys stored in the hardware security module." },
        ],
        correctAnswer: "A" as const,
        explanation: `Prematurely removing synchronization in "${c.name}" breaks memory visibility barriers, creating silent data corruption and race conditions that only reproduce under high concurrency.`,
        difficulty: "hard" as const,
      });
    }
  }

  const edges =
    customEdges.length > 0
      ? customEdges
      : concepts.slice(0, -1).map((c, i) => ({
          prerequisiteName: c.name,
          conceptName: concepts[i + 1].name,
          weight: 0.9,
        }));

  return {
    courseTitle: title,
    courseSubject: "Computer Science",
    concepts,
    edges,
    questions,
  };
}


export function buildDeterministicConceptBiteFallback(
  conceptName: string,
  description?: string,
  preferredIndex?: number
): ConceptBiteOutput {
  const lower = (conceptName + " " + (description ?? "")).toLowerCase();

  // 1. Computer Networks / Routing Algorithms / Protocols
  if (
    lower.includes("rout") ||
    lower.includes("network") ||
    lower.includes("packet") ||
    lower.includes("dijkstra") ||
    lower.includes("distance vector") ||
    lower.includes("bgp") ||
    lower.includes("ospf") ||
    lower.includes("ip ") ||
    lower.includes("subnet")
  ) {
    const anchorEn =
      "Remember: Routing Algorithms act as the distributed GPS of the internet, dynamically calculating the optimal hop-by-hop detour around congested or severed links.";
    const anchorHi =
      "याद रखें: Routing Algorithms इंटरनेट का स्मार्ट GPS हैं — जो जाम या टूटे रास्तों के बावजूद डेटा को सबसे सुरक्षित और छोटे रास्ते से पहुँचाते हैं।";

    const intuitionEn =
      "When you stream video or send data, packets traverse dozens of independent networks. Routing algorithms dynamically calculate the optimal next-hop router so data reaches its destination even when links congest or hardware fails.";
    const intuitionHi =
      "जब आप इंटरनेट पर डेटा भेजते हैं, तो वह कई अलग-अलग नेटवर्क्स से होकर गुजरता है। रूटिंग एल्गोरिदम लगातार यह तय करते हैं कि अगला सबसे तेज़ कदम (hop) कौन सा होगा ताकि केबल कटने या ट्रैफिक जाम पर भी डेटा सुरक्षित पहुंचे।";

    const analogyEn =
      "Like a live GPS navigation app (Waze/Google Maps): when an accident blocks an expressway, it dynamically re-routes thousands of cars through parallel avenues before gridlock freezes the city.";
    const analogyHi =
      "जैसे गूगल मैप्स या एक समझदार ट्रैफिक पुलिस: अगर आगे मुख्य सड़क पर जाम है, तो वह तुरंत गाड़ियों को समानांतर गलियों से मोड़ देता है ताकि शहर में चक्का जाम न हो।";

    const challengePool: BilingualChallenge[] = [
      {
        en: {
          question:
            "An ISP configures routing metrics where link cost equals real-time traffic volume. Link A gets busy, so routers switch traffic to Link B. Link B instantly saturates while Link A becomes empty, causing all routers to switch back to Link A every 3 seconds ('route flapping'). Why does classic shortest-path routing fail under load-sensitive metrics?",
          options: [
            {
              key: "A",
              text: "All routers independently and simultaneously compute the same new path from stale global state, shifting 100% of demand at once.",
            },
            {
              key: "B",
              text: "Dijkstra's algorithm is mathematically incapable of running on graphs with cycles.",
            },
            {
              key: "C",
              text: "Network cables physically throttle throughput when routing tables update frequently.",
            },
          ],
          correctAnswer: "A",
          explanation:
            "When cost depends on load, moving traffic shifts the cost, making the 'shortest' path immediately the worst path. Real systems use damping hysteresis or multipath (ECMP) to prevent oscillation.",
        },
        hi: {
          question:
            "एक ISP ने नियम बनाया जहाँ लिंक की कॉस्ट उसके वर्तमान ट्रैफिक लोड के बराबर है। जैसे ही लिंक A भरता है, सभी राऊटर सारा ट्रैफिक लिंक B पर भेज देते हैं। फिर लिंक B भर जाता है और A खाली हो जाता है, और यह चक्र हर 3 सेकंड में दोहराता रहता है ('रूट फ्लैपिंग')। लोड-आधारित मीट्रिक पर शॉर्टेस्ट पाथ रूटिंग क्यों विफल होती है?",
          options: [
            {
              key: "A",
              text: "सभी राऊटर एक साथ पुराने डेटा के आधार पर वही नया रास्ता चुन लेते हैं, जिससे सारा ट्रैफिक एक साथ दूसरी तरफ शिफ्ट हो जाता है।",
            },
            {
              key: "B",
              text: "डायक्स्ट्रा एल्गोरिदम लूप वाले नेटवर्क को हल करने में असमर्थ है।",
            },
            {
              key: "C",
              text: "राऊटर की मेमोरी भर जाने से केबल की गति धीमी हो जाती है।",
            },
          ],
          correctAnswer: "A",
          explanation:
            "जब कॉस्ट लोड पर निर्भर होती है, तो ट्रैफिक बदलने से कॉस्ट भी बदल जाती है। असली इंटरनेट में इसके लिए हिस्टेरेसिस (hysteresis) या ECMP का उपयोग किया जाता है।",
        },
      },
      {
        en: {
          question:
            "In a Distance-Vector network, Link A-B suddenly fails. Node B updates distance to A as ∞. But neighbor C previously learned a route to A via B with cost 2, and advertises this back to B. B now mistakenly thinks it can reach A via C with cost 3. Why does 'Split Horizon with Poison Reverse' fail to prevent count-to-infinity in 3-node ring loops?",
          options: [
            {
              key: "A",
              text: "Poison reverse only suppresses routes to the immediate predecessor, but cannot detect cyclic loops involving 3 or more nodes.",
            },
            {
              key: "B",
              text: "Routers drop all packets once the TTL hop count exceeds 15.",
            },
            {
              key: "C",
              text: "Link State advertisements override Distance Vector distance metrics.",
            },
          ],
          correctAnswer: "A",
          explanation:
            "Split horizon only hides routes from the 1-hop neighbor it learned them from. In a triangle (A-B-C-A), routing misinformation circulates around the third node unhindered.",
        },
        hi: {
          question:
            "डिस्टेंस-वेक्टर नेटवर्क में लिंक A-B कट जाता है। B दूरी को ∞ मान लेता है। लेकिन पड़ोसी C अभी भी B को बताता है कि वह B के ज़रिए 2 स्टेप में A तक पहुँच सकता है। B अब सोचता है कि वह C के ज़रिए 3 स्टेप में पहुँच जाएगा। 3 नोड्स वाले रिंग लूप में 'स्प्लिट होराइजन' काउंट-टू-इन्फिनिटी को क्यों नहीं रोक पाता?",
          options: [
            {
              key: "A",
              text: "स्प्लिट होराइजन सिर्फ सीधे 1-कदम पड़ोसी से छुपाता है, लेकिन 3 नोड्स के चक्रीय लूप में सूचना घूमकर वापस आ जाती है।",
            },
            {
              key: "B",
              text: "हॉप काउंट 15 से ऊपर जाते ही सभी पैकेट स्वतः नष्ट हो जाते हैं।",
            },
            {
              key: "C",
              text: "लिंक स्टेट विज्ञापन डिस्टेंस वेक्टर तालिकाओं को मिटा देते हैं।",
            },
          ],
          correctAnswer: "A",
          explanation:
            "स्प्लिट होराइजन केवल सीधे पूर्ववर्ती को विज्ञापन देने से रोकता है; त्रिकोणीय लूप में जानकारी तीसरे नोड से घूमकर आ जाती है।",
        },
      },
      {
        en: {
          question:
            "A transit provider (AS-1) receives a packet destined for a customer in AS-2. AS-1 routes the packet out of its network at the closest possible peering exchange ('hot-potato routing'), even though carrying it across its own private backbone would reduce customer latency by 40ms. Why do autonomous systems do this?",
          options: [
            {
              key: "A",
              text: "To minimize internal transit backbone utilization and infrastructure operating expenses.",
            },
            {
              key: "B",
              text: "Because BGP RFC specifications strictly forbid carrying transit traffic across more than one internal router.",
            },
            {
              key: "C",
              text: "Because routers lack the CPU capability to calculate latency across autonomous system boundaries.",
            },
          ],
          correctAnswer: "A",
          explanation:
            "Inter-domain routing prioritizes business policy and internal cost minimization: autonomous systems eject transit traffic as early as possible to minimize their own carrying costs.",
        },
        hi: {
          question:
            "इंटरनेट ट्रांजिट नेटवर्क (AS-1) के पास एक पैकेट आता है जिसे AS-2 के ग्राहक तक जाना है। AS-1 उस पैकेट को सबसे नजदीकी गेटवे से ही AS-2 को सौंप देता है ('हॉट पोटैटो रूटिंग'), भले ही AS-1 के अपने सुपरफास्ट बैकबोन से ले जाने पर 40ms कम लेटेंसी मिलती। AS-1 ऐसा क्यों करता है?",
          options: [
            {
              key: "A",
              text: "अपने नेटवर्क के संसाधनों और वित्तीय लागत को बचाने के लिए, ताकि ट्रैफिक ढोने का खर्च दूसरे नेटवर्क पर चला जाए।",
            },
            {
              key: "B",
              text: "क्योंकि BGP प्रोटोकॉल दो से ज्यादा अंदरूनी राऊटर से गुजरने की अनुमति नहीं देता।",
            },
            {
              key: "C",
              text: "क्योंकि राऊटर में लेटेंसी नापने की क्षमता नहीं होती।",
            },
          ],
          correctAnswer: "A",
          explanation:
            "इंटर-डोमेन रूटिंग यूजर की लेटेंसी से ज्यादा व्यावसायिक लागत और पॉलिसी को प्राथमिकता देती है — ISP ट्रैफिक को तुरंत अपने नेटवर्क से बाहर निकालना चाहते हैं।",
        },
      },
      {
        en: {
          question:
            "A regional ISP accidentally advertises a /24 route for an IP block owned by a cloud provider announcing a /16 prefix. Why does global internet traffic for that /24 subnet instantly redirect to the rogue ISP, causing a black hole?",
          options: [
            {
              key: "A",
              text: "Routers strictly evaluate destination IP addresses using Longest Prefix Match before evaluating AS-path or route cost.",
            },
            {
              key: "B",
              text: "The /24 prefix grants automated cryptographic priority in BGP protocol.",
            },
            {
              key: "C",
              text: "Smaller subnets are always assumed to be high-priority fiber connections.",
            },
          ],
          correctAnswer: "A",
          explanation:
            "Longest Prefix Match is the inviolable rule of IP routing: the most specific subnet mask (/24 > /16) always wins, regardless of path quality or distance.",
        },
        hi: {
          question:
            "एक क्षेत्रीय ISP ने गलती से किसी अन्य कंपनी के /16 आईपी ब्लॉक में से एक छोटा /24 ब्लॉक घोषित (announce) कर दिया। सारा ग्लोबल ट्रैफिक तुरंत उस अनाधिकृत ISP पर क्यों मुड़ जाता है?",
          options: [
            {
              key: "A",
              text: "राऊटर हमेशा सबसे पहले 'लॉन्गेस्ट प्रीफिक्स मैच' (सबसे सटीक सबनेट) चुनते हैं, उसके बाद ही हॉप्स या स्पीड देखते हैं।",
            },
            {
              key: "B",
              text: "/24 सबनेट को BGP में विशेष सुरक्षा प्राथमिकता मिलती है।",
            },
            {
              key: "C",
              text: "छोटे सबनेट हमेशा तेज़ फाइबर लाइन माने जाते हैं।",
            },
          ],
          correctAnswer: "A",
          explanation:
            "आईपी रूटिंग का पहला नियम है 'लॉन्गेस्ट प्रीफिक्स मैच' — जो सबनेट जितना विशिष्ट होगा (/24 > /16), पैकेट वहीं जाएगा।",
        },
      },
    ];

    const chosenIndex =
      typeof preferredIndex === "number"
        ? Math.abs(preferredIndex) % challengePool.length
        : Math.floor(Math.random() * challengePool.length);
    const chosenChallenge = challengePool[chosenIndex];

    return {
      conceptName,
      intuition: intuitionEn,
      analogy: analogyEn,
      anchorEn,
      anchorHi,
      vernacularAnchor: anchorHi,
      quickCheck: chosenChallenge.en,
      en: {
        intuition: intuitionEn,
        analogy: analogyEn,
        anchor: anchorEn,
        quickCheck: chosenChallenge.en,
      },
      hi: {
        intuition: intuitionHi,
        analogy: analogyHi,
        anchor: anchorHi,
        quickCheck: chosenChallenge.hi,
      },
      challengePool,
    };
  }

  // 2. B-Tree & Indexing
  if (lower.includes("b-tree") || lower.includes("index")) {
    const anchorEn =
      "Remember: A B-Tree index trades write performance and disk space for O(log N) lookup speed by keeping wide, block-sized sorted nodes.";
    const anchorHi =
      "याद रखें: B-Tree इंडेक्स डिस्क ब्लॉक के आकार में डेटा रखता है, जिससे करोड़ों रिकॉर्ड्स में से खोज सिर्फ 3-4 डिस्क रीड्स में पूरी हो जाती है।";

    const intuitionEn =
      "Without an index, finding a row in a million-row database requires a Full Table Scan reading every disk block. A B-Tree index maintains sorted hierarchical blocks, shrinking lookups from O(N) to O(log N) disk reads.";
    const intuitionHi =
      "बिना इंडेक्स के लाखों रिकॉर्ड्स वाली टेबल में कोई पंक्ति खोजना पूरी किताब का हर पन्ना पढ़ने जैसा है। B-Tree इंडेक्स पेजों को एक पेड़ के रूप में व्यवस्थित रखता है ताकि 3-4 डिस्क रीड्स में उत्तर मिल जाए।";

    const analogyEn =
      "Like a thumb-tabbed dictionary: instead of reading all 50,000 pages to find 'Zebra', you jump straight to the 'Z' section tab, opening only 3 pages.";
    const analogyHi =
      "जैसे डिक्शनरी में अक्षरों के साइड-टैब: 'Zebra' ढूंढने के लिए 50,000 पन्ने पलटने के बजाय आप सीधे 'Z' वाले टैब पर अंगूठा रखते हैं।";

    const challengePool: BilingualChallenge[] = [
      {
        en: {
          question:
            "An e-commerce database switches its primary key from auto-incrementing integers to random UUIDv4. At 50 million records, insert throughput plunges by 85% and disk I/O hits 100%. What physical B-Tree behavior causes this collapse?",
          options: [
            {
              key: "A",
              text: "Random keys insert into arbitrary leaf pages across the tree, causing massive page splits and cache-eviction random writes.",
            },
            {
              key: "B",
              text: "UUID strings cannot be stored in B-Tree internal nodes.",
            },
            {
              key: "C",
              text: "B-Trees require O(N) rebalancing whenever an alphanumeric key is added.",
            },
          ],
          correctAnswer: "A",
          explanation:
            "Sequential IDs always append to the rightmost leaf page. Random UUIDs fragment pages throughout the entire tree, forcing the engine to flush and reload disk blocks constantly.",
        },
        hi: {
          question:
            "एक बड़े डेटाबेस ने अपनी प्राइमरी-की को ऑटो-इंक्रीमेंट नंबर से बदलकर रैंडम UUIDv4 कर दिया। 5 करोड़ रिकॉर्ड्स पर नया डेटा डालने की स्पीड 85% गिर गई और डिस्क I/O 100% हो गया। B-Tree की कौन सी प्रक्रिया इसकी मुख्य वजह है?",
          options: [
            {
              key: "A",
              text: "रैंडम कीज़ पूरे पेड़ में कहीं भी घुसती हैं, जिससे बार-बार पेज स्प्लिट (Page Split) और रैंडम डिस्क राइट्स होते हैं।",
            },
            {
              key: "B",
              text: "UUID स्ट्रिंग्स को B-Tree में स्टोर नहीं किया जा सकता।",
            },
            {
              key: "C",
              text: "B-Tree में अल्फान्यूमेरिक की जोड़ने पर हर बार पूरा डेटाबेस रीबैलेंस होता है।",
            },
          ],
          correctAnswer: "A",
          explanation:
            "सीक्वेंस नंबर हमेशा सबसे आखिरी पेज पर जुड़ते हैं, जबकि रैंडम UUID बीच के भरे हुए पेजों को फाड़कर (split) नए पेज बनाते हैं, जिससे भारी डिस्क I/O होता है।",
        },
      },
      {
        en: {
          question:
            "A table has a composite index on (status, created_at). A query runs: WHERE created_at > '2026-01-01' without mentioning 'status'. Why does the query planner reject the index and execute a slow Full Table Scan?",
          options: [
            {
              key: "A",
              text: "B-Trees sort composite keys lexicographically; skipping the leading column prevents binary searching the tree.",
            },
            {
              key: "B",
              text: "Date types cannot be evaluated in composite indexes.",
            },
            {
              key: "C",
              text: "Composite indexes are only valid for exact equality (=) matches.",
            },
          ],
          correctAnswer: "A",
          explanation:
            "Like a phone book sorted by (LastName, FirstName), you cannot use the index to find everyone named 'John' without knowing their last name.",
        },
        hi: {
          question:
            "एक टेबल में (status, created_at) पर कंपोजिट इंडेक्स है। क्वेरी चलती है: WHERE created_at > '2026-01-01' (बिना status बताए)। डेटाबेस इंडेक्स को छोड़कर स्लो फुल टेबल स्कैन क्यों करता है?",
          options: [
            {
              key: "A",
              text: "B-Tree कंपोजिट कीज़ को पहले कॉलम के अनुसार छांटता है; पहला कॉलम छोड़े बिना पेड़ में बाइनरी सर्च असंभव है।",
            },
            {
              key: "B",
              text: "तारीख (Date) को कंपोजिट इंडेक्स में नहीं खोजा जा सकता।",
            },
            {
              key: "C",
              text: "कंपोजिट इंडेक्स केवल सटीक बराबर (=) पर ही काम करता है।",
            },
          ],
          correctAnswer: "A",
          explanation:
            "जैसे फोन डायरेक्टरी में नाम (उपनाम, नाम) के अनुसार छपे होते हैं; अगर उपनाम न पता हो, तो 'अमित' नाम के सभी लोगों को ढूंढने के लिए पूरी डायरेक्टरी छाननी पड़ेगी।",
        },
      },
    ];

    const chosenIndex =
      typeof preferredIndex === "number"
        ? Math.abs(preferredIndex) % challengePool.length
        : Math.floor(Math.random() * challengePool.length);
    const chosenChallenge = challengePool[chosenIndex];

    return {
      conceptName,
      intuition: intuitionEn,
      analogy: analogyEn,
      anchorEn,
      anchorHi,
      vernacularAnchor: anchorHi,
      quickCheck: chosenChallenge.en,
      en: {
        intuition: intuitionEn,
        analogy: analogyEn,
        anchor: anchorEn,
        quickCheck: chosenChallenge.en,
      },
      hi: {
        intuition: intuitionHi,
        analogy: analogyHi,
        anchor: anchorHi,
        quickCheck: chosenChallenge.hi,
      },
      challengePool,
    };
  }

  // 3. Deadlock & Concurrency
  if (lower.includes("deadlock") || lower.includes("concurrency")) {
    const anchorEn =
      "Remember: Deadlocks only occur when all four Coffman conditions align — break just one (like enforcing global lock hierarchy) and deadlock is mathematically impossible.";
    const anchorHi =
      "याद रखें: Deadlock तभी होता है जब चारों Coffman शर्तें पूरी हों — सिर्फ एक शर्त (जैसे लॉकिंग का क्रम तय करना) तोड़ते ही डेडलॉक असंभव हो जाता है।";

    const intuitionEn =
      "Deadlock is a permanent freeze where two or more threads each hold a lock the other thread needs to proceed. Operating systems eliminate deadlocks by systematically dismantling circular wait hierarchies.";
    const intuitionHi =
      "डेडलॉक तब होता है जब दो या अधिक प्रोसेस एक-दूसरे के ताले (Lock) खुलने का इंतजार करते हुए हमेशा के लिए जम जाते हैं। सिस्टम सर्कुलर वेट को तोड़कर डेडलॉक को पूरी तरह रोकता है।";

    const analogyEn =
      "Two stubborn drivers meet head-on on a one-lane mountain bridge: neither can go forward, neither will back up. Both freeze indefinitely until one yields.";
    const analogyHi =
      "एक-लेन वाले संकरे पुल पर दो गाड़ियां आमने-सामने आकर रुक गईं: कोई भी पीछे हटने को तैयार नहीं है। जब तक कोई एक पीछे नहीं हटेगा, दोनों हमेशा के लिए फंसे रहेंगे।";

    const challengePool: BilingualChallenge[] = [
      {
        en: {
          question:
            "A banking system eliminates deadlocks between account transfers by enforcing global lock ordering: lock(min(acc1, acc2)) then lock(max(acc1, acc2)). Which Coffman condition is mathematically eliminated by this rule?",
          options: [
            {
              key: "A",
              text: "Circular Wait, because directed lock request cycles cannot exist in a strictly ordered directed acyclic graph.",
            },
            { key: "B", text: "Mutual Exclusion, because locks can now be shared." },
            { key: "C", text: "No Preemption, because threads are forcibly terminated." },
          ],
          correctAnswer: "A",
          explanation:
            "By enforcing strict ascending resource acquisition, no circular wait chain (A waiting for B waiting for A) can ever form.",
        },
        hi: {
          question:
            "एक बैंक खाता ट्रांसफर में डेडलॉक रोकने के लिए नियम बनाता है: हमेशा छोटे खाता नंबर को पहले लॉक करो, फिर बड़े को: lock(min(A, B)) फिर lock(max(A, B))। यह नियम किस Coffman शर्त को पूरी तरह खत्म करता है?",
          options: [
            {
              key: "A",
              text: "सर्कुलर वेट (Circular Wait), क्योंकि सख्त बढ़ते क्रम में कभी गोल घेरे का लूप नहीं बन सकता।",
            },
            { key: "B", text: "म्यूचुअल एक्सक्लूजन, क्योंकि अब ताले साझा हो जाते हैं।" },
            { key: "C", text: "नो प्रीएम्प्शन, क्योंकि प्रोसेस को जबरन रोका जाता है।" },
          ],
          correctAnswer: "A",
          explanation:
            "नंबर के बढ़ते क्रम में संसाधन मांगने से सर्कुलर वेट की संभावना गणितीय रूप से शून्य हो जाती है।",
        },
      },
      {
        en: {
          question:
            "In Dijkstra's Banker's Algorithm, a state is classified as 'unsafe'. Does this mean the system is currently deadlocked?",
          options: [
            {
              key: "A",
              text: "No; an unsafe state means future requests could lead to deadlock if all processes demand their maximum declared resources simultaneously.",
            },
            {
              key: "B",
              text: "Yes; all processes are already in circular wait and must be killed.",
            },
            {
              key: "C",
              text: "Yes; the operating system kernel has run out of physical RAM.",
            },
          ],
          correctAnswer: "A",
          explanation:
            "Unsafe does not equal deadlocked: it merely means the system cannot guarantee safe completion under the worst-case maximum claim scenario.",
        },
        hi: {
          question:
            "बैंकर एल्गोरिदम में किसी स्थिति को 'असुरक्षित' (Unsafe) घोषित किया जाता है। क्या इसका मतलब यह है कि सिस्टम में वर्तमान में डेडलॉक हो चुका है?",
          options: [
            {
              key: "A",
              text: "नहीं; असुरक्षित का मतलब है कि अगर सभी प्रोसेस एक साथ अपने अधिकतम संसाधन मांग लें, तो भविष्य में डेडलॉक हो सकता है।",
            },
            {
              key: "B",
              text: "हाँ; सभी प्रोसेस सर्कुलर वेट में फंस चुके हैं।",
            },
            {
              key: "C",
              text: "हाँ; सिस्टम की रैम पूरी तरह खत्म हो गई है।",
            },
          ],
          correctAnswer: "A",
          explanation:
            "असुरक्षित स्थिति डेडलॉक नहीं होती, बल्कि यह एक चेतावनी है कि सबसे खराब स्थिति में डेडलॉक से बचने की गारंटी नहीं है।",
        },
      },
    ];

    const chosenIndex =
      typeof preferredIndex === "number"
        ? Math.abs(preferredIndex) % challengePool.length
        : Math.floor(Math.random() * challengePool.length);
    const chosenChallenge = challengePool[chosenIndex];

    return {
      conceptName,
      intuition: intuitionEn,
      analogy: analogyEn,
      anchorEn,
      anchorHi,
      vernacularAnchor: anchorHi,
      quickCheck: chosenChallenge.en,
      en: {
        intuition: intuitionEn,
        analogy: analogyEn,
        anchor: anchorEn,
        quickCheck: chosenChallenge.en,
      },
      hi: {
        intuition: intuitionHi,
        analogy: analogyHi,
        anchor: anchorHi,
        quickCheck: chosenChallenge.hi,
      },
      challengePool,
    };
  }

  // 4. File Systems & Storage Management (must match before generic scheduling to prevent "disk scheduling" collision)
  if (
    lower.includes("file system") ||
    lower.includes("storage management") ||
    lower.includes("inode") ||
    lower.includes("file allocation") ||
    lower.includes("directory structure") ||
    (lower.includes("disk") && lower.includes("schedul"))
  ) {
    const anchorEn =
      "Remember: Inodes store file metadata and data block pointers, not filenames — directory entries map human-readable names to inode numbers.";
    const anchorHi =
      "याद रखें: Inode में फ़ाइल का मेटाडेटा और डिस्क ब्लॉक पॉइंटर होते हैं, नाम नहीं — डायरेक्टरी केवल नाम को Inode नंबर से जोड़ती है।";

    const intuitionEn =
      "File Systems abstract raw physical disk blocks into a logical hierarchy of files and directories, managing allocation, permissions, and metadata persistence through Inodes and allocation tables.";
    const intuitionHi =
      "फ़ाइल सिस्टम हार्ड डिस्क के असंगठित सेक्टर्स को फाइलों और फ़ोल्डरों की तार्किक संरचना में बदलता है, ताकि डेटा को सुरक्षित रखा जा सके और तेजी से पढ़ा जा सके।";

    const analogyEn =
      "Like a library catalog: the title card (directory entry) holds only the call number (inode), which directs you to the exact aisle and shelf coordinates (disk blocks) where the physical book pages are stored.";
    const analogyHi =
      "जैसे लाइब्रेरी का इंडेक्स कार्ड: कार्ड पर किताब का नाम (डायरेक्टरी) केवल एक इंडेक्स नंबर (inode) बताता है, जो आपको उस अलमारी और शेल्फ (डेटा ब्लॉक्स) तक पहुँचाता है जहाँ पन्ने रखे हैं।";

    const challengePool: BilingualChallenge[] = [
      {
        en: {
          question:
            "A system administrator creates millions of 10-byte text files on a 2 TB ext4 file system. Suddenly, writes fail with 'ENOSPC' (No space left on device), but `df -h` reports 94% free storage capacity. What is the root cause?",
          options: [
            {
              key: "A",
              text: "The file system exhausted its pre-allocated Inode table (`df -i` is at 100%), even though raw storage data blocks remain abundant.",
            },
            { key: "B", text: "The disk drive controller hardware encountered an unrecoverable head crash." },
            { key: "C", text: "ext4 file systems cannot store files smaller than 4096 bytes." },
          ],
          correctAnswer: "A",
          explanation:
            "In Unix file systems, every file requires a discrete inode structure regardless of its size. Millions of tiny files consume all available inodes before consuming physical disk blocks.",
        },
        hi: {
          question:
            "एक 2 TB ext4 फ़ाइल सिस्टम पर 10-बाइट की फ़ाइल लिखते समय 'ENOSPC' (No space left on device) एरर आता है, जबकि `df -h` दिखाता है कि 94% डिस्क खाली है। इसका मूल कारण क्या है?",
          options: [
            {
              key: "A",
              text: "सिस्टम में Inodes की संख्या समाप्त हो गई है (`df -i` 100% भर गया है), भले ही डिस्क का स्टोरेज स्पेस खाली हो।",
            },
            { key: "B", text: "हार्ड डिस्क का रीड/राइट हेड खराब हो चुका है।" },
            { key: "C", text: "ext4 फ़ाइल सिस्टम 4096 बाइट से छोटी फ़ाइलों को सपोर्ट नहीं करता।" },
          ],
          correctAnswer: "A",
          explanation:
            "हर फ़ाइल के लिए एक Inode की आवश्यकता होती है। लाखों छोटी फ़ाइलें बनाने से Inode टेबल भर जाती है, जिससे नया डेटा नहीं लिखा जा सकता।",
        },
      },
      {
        en: {
          question:
            "An engineer creates both a Hard Link (`ln target.txt hard.txt`) and a Symbolic Link (`ln -s target.txt sym.txt`). If `target.txt` is deleted, what happens upon reading each link?",
          options: [
            {
              key: "A",
              text: "`hard.txt` reads successfully because it points directly to the inode (hard link count decremented from 2 to 1); `sym.txt` becomes a broken dangling link.",
            },
            { key: "B", text: "Both links fail immediately because the target inode was destroyed." },
            { key: "C", text: "`sym.txt` succeeds by copying data, while `hard.txt` is automatically deleted." },
          ],
          correctAnswer: "A",
          explanation:
            "Hard links reference the underlying inode directly; data blocks persist until the inode link count reaches 0. Symbolic links store only the target filepath string, breaking when the path is removed.",
        },
        hi: {
          question:
            "एक फ़ाइल `target.txt` के लिए हार्ड लिंक (`ln target.txt hard.txt`) और सॉफ्ट लिंक (`ln -s target.txt sym.txt`) बनाया गया। मूल `target.txt` डिलीट करने के बाद क्या होगा?",
          options: [
            {
              key: "A",
              text: "`hard.txt` डेटा पढ़ेगा क्योंकि वह सीधे Inode से जुड़ा है (लिंक काउंट 2 से 1 हुआ); जबकि `sym.txt` डैंगलिंग लिंक बनकर विफल होगा।",
            },
            { key: "B", text: "दोनों लिंक तुरंत फेल हो जाएँगे क्योंकि मूल फ़ाइल हट चुकी है।" },
            { key: "C", text: "`sym.txt` डेटा को कॉपी कर लेगा और `hard.txt` डिलीट हो जाएगा।" },
          ],
          correctAnswer: "A",
          explanation:
            "हार्ड लिंक सीधे Inode की ओर इशारा करता है, इसलिए डेटा तब तक बना रहता है जब तक सारे हार्ड लिंक न हटें। सॉफ्ट लिंक केवल पाथ का नाम रखता है, इसलिए पाथ मिटने पर टूट जाता है।",
        },
      },
      {
        en: {
          question:
            "In mechanical disk scheduling, why is the SCAN (Elevator) algorithm preferred over Shortest Seek Time First (SSTF)?",
          options: [
            {
              key: "A",
              text: "SCAN sweeps across cylinders uniformly in one direction before reversing, preventing starvation of requests on distant tracks during localized I/O bursts.",
            },
            { key: "B", text: "SCAN doubles the rotational spindle motor RPM speed." },
            { key: "C", text: "SSTF cannot execute read operations on rotating magnetic platters." },
          ],
          correctAnswer: "A",
          explanation:
            "SSTF continually serves tracks near the head, causing starvation for distant tracks under heavy load. SCAN guarantees bounded waiting times by servicing tracks sequentially in an elevator sweep.",
        },
        hi: {
          question:
            "डिस्क शेड्यूलिंग में SSTF के मुकाबले SCAN (एलिवेटर) एल्गोरिदम को प्राथमिकता क्यों दी जाती है?",
          options: [
            {
              key: "A",
              text: "SCAN डिस्क हेड को एक सिरे से दूसरे सिरे तक झाड़ू की तरह चलाता है, जिससे दूर के ट्रैक्स की रिक्वेस्ट कभी भी भूख (starvation) से नहीं अटकतीं।",
            },
            { key: "B", text: "SCAN डिस्क की घूमने की गति को दोगुना कर देता है।" },
            { key: "C", text: "SSTF मैग्नेटिक डिस्क पर रीड ऑपरेशन नहीं कर सकता।" },
          ],
          correctAnswer: "A",
          explanation:
            "SSTF केवल पास की रिक्वेस्ट पूरी करता रहता है जिससे दूर वाले ट्रैक्स हमेशा अटके रह सकते हैं। SCAN लिफ्ट की तरह सबको बारी-बारी से सेवा देता है।",
        },
      },
    ];

    const chosenIndex =
      typeof preferredIndex === "number"
        ? Math.abs(preferredIndex) % challengePool.length
        : Math.floor(Math.random() * challengePool.length);
    const chosenChallenge = challengePool[chosenIndex];

    return {
      conceptName,
      intuition: intuitionEn,
      analogy: analogyEn,
      anchorEn,
      anchorHi,
      vernacularAnchor: anchorHi,
      quickCheck: chosenChallenge.en,
      en: {
        intuition: intuitionEn,
        analogy: analogyEn,
        anchor: anchorEn,
        quickCheck: chosenChallenge.en,
      },
      hi: {
        intuition: intuitionHi,
        analogy: analogyHi,
        anchor: anchorHi,
        quickCheck: chosenChallenge.hi,
      },
      challengePool,
    };
  }

  // 5. Memory Management & Paging
  if (
    (lower.includes("memory") && (lower.includes("paging") || lower.includes("page table") || lower.includes("segment") || lower.includes("tlb") || lower.includes("address translation"))) ||
    lower.includes("paging") ||
    lower.includes("segmentation")
  ) {
    const anchorEn =
      "Remember: Paging eliminates external fragmentation by using fixed-size frames, while the Translation Lookaside Buffer (TLB) caches page table lookups to prevent double memory accesses.";
    const anchorHi =
      "याद रखें: Paging बाहरी विखंडन (external fragmentation) मिटाती है, और TLB कैश पेज टेबल लुकअप को तेज़ बनाकर दोहरे मेमोरी एक्सेस से बचाता है।";

    const intuitionEn =
      "Memory Management maps a process's contiguous virtual address space to non-contiguous physical RAM frames, translating addresses at hardware speeds while enforcing process isolation.";
    const intuitionHi =
      "मेमोरी मैनेजमेंट हर प्रोसेस को एक स्वतंत्र और बड़ा वर्चुअल एड्रेस स्पेस दिखाता है, जिसे हार्डवेयर (MMU) द्वारा वास्तविक रैम के अलग-अलग टुकड़ों (फ्रेम्स) में मैप किया जाता है।";

    const analogyEn =
      "Like an apartment building mailbox bank: incoming mail uses apartment numbers (virtual addresses), but the mail carrier delivers letters to physical lockboxes on different wall racks (physical frames).";
    const analogyHi =
      "जैसे किसी बड़े होटल का कमरा नंबर: मेहमान को सिर्फ कमरा नंबर (वर्चुअल एड्रेस) पता होता है, जबकि होटल का सिस्टम (MMU) उसे वास्तविक विंग और फ्लोर (फिजिकल फ्रेम) पर भेजता है।";

    const challengePool: BilingualChallenge[] = [
      {
        en: {
          question:
            "A system uses single-level paging with 100ns RAM access time. The TLB has an 80% hit ratio and 20ns lookup time. What is the Effective Memory Access Time (EMAT)?",
          options: [
            {
              key: "A",
              text: "140 ns (Hit: 20ns + 100ns = 120ns; Miss: 20ns + 100ns for page table + 100ns for data = 220ns; EMAT = 0.8*120 + 0.2*220 = 140ns).",
            },
            { key: "B", text: "100 ns because TLB hits completely eliminate RAM latency." },
            { key: "C", text: "220 ns because every memory reference requires two serial RAM reads." },
          ],
          correctAnswer: "A",
          explanation:
            "On TLB hit (80%), memory is accessed once (20+100=120ns). On miss (20%), the page table in RAM is accessed first, then the target frame (20+100+100=220ns). Average = 0.8(120) + 0.2(220) = 140ns.",
        },
        hi: {
          question:
            "एक सिस्टम में RAM एक्सेस का समय 100ns है। TLB का हिट अनुपात 80% और लुकअप समय 20ns है। प्रभावी मेमोरी एक्सेस समय (EMAT) क्या होगा?",
          options: [
            {
              key: "A",
              text: "140 ns (हिट पर: 20+100=120ns; मिस पर: 20+100+100=220ns; EMAT = 0.8*120 + 0.2*220 = 140ns)।",
            },
            { key: "B", text: "100 ns क्योंकि TLB हिट से रैम का समय शून्य हो जाता है।" },
            { key: "C", text: "220 ns क्योंकि हर बार दो बार रैम पढ़ना पड़ता है।" },
          ],
          correctAnswer: "A",
          explanation:
            "TLB हिट पर एक बार RAM पढ़ी जाती है (120ns), जबकि मिस होने पर पेज टेबल और डेटा दोनों के लिए RAM पढ़नी पड़ती है (220ns)। औसत समय 140ns आता है।",
        },
      },
    ];

    const chosenIndex =
      typeof preferredIndex === "number"
        ? Math.abs(preferredIndex) % challengePool.length
        : Math.floor(Math.random() * challengePool.length);
    const chosenChallenge = challengePool[chosenIndex];

    return {
      conceptName,
      intuition: intuitionEn,
      analogy: analogyEn,
      anchorEn,
      anchorHi,
      vernacularAnchor: anchorHi,
      quickCheck: chosenChallenge.en,
      en: {
        intuition: intuitionEn,
        analogy: analogyEn,
        anchor: anchorEn,
        quickCheck: chosenChallenge.en,
      },
      hi: {
        intuition: intuitionHi,
        analogy: analogyHi,
        anchor: anchorHi,
        quickCheck: chosenChallenge.hi,
      },
      challengePool,
    };
  }

  // 6. Virtual Memory & Page Replacement
  if (
    lower.includes("virtual memory") ||
    lower.includes("page replacement") ||
    lower.includes("demand paging") ||
    lower.includes("thrashing") ||
    lower.includes("belady")
  ) {
    const anchorEn =
      "Remember: Thrashing occurs when active working sets exceed physical RAM, causing the OS to spend more time swapping pages than executing instructions.";
    const anchorHi =
      "याद रखें: थ्रैशिंग (Thrashing) तब होती है जब सक्रिय प्रक्रियाओं की मेमोरी जरूरत रैम से ज्यादा हो जाती है, जिससे सिस्टम काम करने के बजाय सिर्फ पेज बदलने में उलझ जाता है।";

    const intuitionEn =
      "Virtual Memory gives processes the illusion of contiguous, unbounded memory by dynamically swapping inactive pages to disk storage and swapping them back into RAM upon page faults.";
    const intuitionHi =
      "वर्चुअल मेमोरी प्रक्रियाओं को बड़ी मेमोरी का भ्रम देती है: जो पेज इस्तेमाल में नहीं हैं उन्हें हार्ड डिस्क में भेज दिया जाता है और ज़रूरत पड़ने पर पेज फॉल्ट के ज़रिये वापस रैम में लाया जाता है।";

    const analogyEn =
      "Like a student studying with a small desk (RAM) and a large personal library (disk): only currently needed textbooks stay on the desk; when a new subject is opened, an unread book is returned to the shelf.";
    const analogyHi =
      "जैसे एक छोटी पढ़ाई की मेज़ (रैम) और पीछे रखी किताबों की बड़ी अलमारी (डिस्क): मेज़ पर केवल वही किताबें रखी जाती हैं जिनकी अभी ज़रूरत है, बाकी अलमारी में रहती हैं।";

    const challengePool: BilingualChallenge[] = [
      {
        en: {
          question:
            "Why is the First-In-First-Out (FIFO) page replacement algorithm susceptible to Belady's Anomaly (where increasing physical page frames increases page faults)?",
          options: [
            {
              key: "A",
              text: "FIFO is not a stack algorithm: the set of pages in an n-frame allocation is not necessarily a subset of pages in an (n+1)-frame allocation.",
            },
            { key: "B", text: "FIFO requires hardware timestamp support which causes clock skew." },
            { key: "C", text: "Belady's anomaly only occurs on distributed network storage." },
          ],
          correctAnswer: "A",
          explanation:
            "In stack algorithms like LRU and Optimal, increasing memory capacity always retains previously cached pages. FIFO discards pages based purely on arrival time, regardless of how frequently they are referenced.",
        },
        hi: {
          question:
            "FIFO (First-In-First-Out) पेज रिप्लेसमेंट एल्गोरिदम में बेलाडी की विसंगति (Belady's Anomaly) क्यों हो सकती है, जहाँ रैम के फ्रेम बढ़ाने पर भी पेज फॉल्ट बढ़ जाते हैं?",
          options: [
            {
              key: "A",
              text: "FIFO स्टैक एल्गोरिदम नहीं है: n फ्रेम्स वाले पेजों का सेट जरूरी नहीं कि (n+1) फ्रेम्स वाले सेट का सबसेट हो।",
            },
            { key: "B", text: "FIFO में टाइमस्टैम्प की समस्या होती है।" },
            { key: "C", text: "यह विसंगति सिर्फ नेटवर्क स्टोरेज पर होती है।" },
          ],
          correctAnswer: "A",
          explanation:
            "LRU जैसे स्टैक एल्गोरिदम में अधिक फ्रेम देने पर पुराने जरूरी पेज सुरक्षित रहते हैं। FIFO सिर्फ आने के क्रम पर पेज हटाता है, जिससे महत्वपूर्ण पेज बार-बार बाहर हो जाते हैं।",
        },
      },
    ];

    const chosenIndex =
      typeof preferredIndex === "number"
        ? Math.abs(preferredIndex) % challengePool.length
        : Math.floor(Math.random() * challengePool.length);
    const chosenChallenge = challengePool[chosenIndex];

    return {
      conceptName,
      intuition: intuitionEn,
      analogy: analogyEn,
      anchorEn,
      anchorHi,
      vernacularAnchor: anchorHi,
      quickCheck: chosenChallenge.en,
      en: {
        intuition: intuitionEn,
        analogy: analogyEn,
        anchor: anchorEn,
        quickCheck: chosenChallenge.en,
      },
      hi: {
        intuition: intuitionHi,
        analogy: analogyHi,
        anchor: anchorHi,
        quickCheck: chosenChallenge.hi,
      },
      challengePool,
    };
  }

  // 7. CPU & Process Scheduling (guaranteed not to collide with File Systems, Disk Scheduling, or Preprocessing)
  const isCpuScheduling =
    !lower.includes("preprocess") &&
    (
      (lower.includes("schedul") && (lower.includes("cpu") || lower.includes("process") || lower.includes("thread") || lower.includes("round robin") || lower.includes("fcfs") || lower.includes("sjf") || lower.includes("time quantum"))) ||
      (lower.includes("process") && (lower.includes("management") || lower.includes("lifecycle") || lower.includes("context switch") || lower.includes("pcb"))) ||
      lower.includes("process management")
    );

  if (isCpuScheduling) {
    const anchorEn =
      "Remember: CPU Scheduling balances responsiveness vs throughput — small time quantums reduce UI latency at the expense of context-switch thrashing.";
    const anchorHi =
      "याद रखें: CPU शेड्यूलर फेयरनेस और स्पीड का संतुलन है — छोटा टाइम क्वांटम यूजर को स्मूथ अनुभव देता है लेकिन बार-बार कॉन्टेक्स्ट स्विच का खर्च बढ़ाता है।";

    const intuitionEn =
      "CPU Scheduling decides which ready thread executes on hardware cores to prevent starvation, maximize CPU utilization, and guarantee responsive user interactions.";
    const intuitionHi =
      "CPU शेड्यूलर तय करता है कि तैयार प्रोसेस में से किसे प्रोसेसर कोर मिलेगा ताकि कोई काम भूखा (starve) न रहे और यूजर को बिना रुके तेज रिस्पांस मिले।";

    const analogyEn =
      "Like a hospital emergency triage nurse: cardiac arrest patients (interactive I/O tasks) are attended to ahead of routine blood test analyses (background batch tasks).";
    const analogyHi =
      "अस्पताल के इमरजेंसी वार्ड की तरह: दिल के मरीज (तत्काल यूजर इनपुट) को पहले देखा जाता है, जबकि रूटीन चेकअप (बैकग्राउंड गणना) को इंतजार कराया जाता है।";

    const challengePool: BilingualChallenge[] = [
      {
        en: {
          question:
            "Under Round Robin scheduling, what is the disastrous consequence of setting the time quantum extremely small (e.g., 5 microseconds)?",
          options: [
            {
              key: "A",
              text: "CPU efficiency collapses because the system spends most of its clock cycles saving and restoring registers (context switch overhead).",
            },
            { key: "B", text: "Interactive tasks will completely starve." },
            { key: "C", text: "The scheduling algorithm transforms into First-Come-First-Served." },
          ],
          correctAnswer: "A",
          explanation:
            "If the quantum approaches the context switch time, the CPU spends 50-80% of its time executing kernel dispatch routines rather than user instructions.",
        },
        hi: {
          question:
            "राउंड रॉबिन शेड्यूलिंग में यदि टाइम क्वांटम बहुत ही छोटा (जैसे 5 माइक्रो-सेकंड) रख दिया जाए, तो क्या गंभीर समस्या होगी?",
          options: [
            {
              key: "A",
              text: "CPU की क्षमता बर्बाद होगी क्योंकि अधिकांश समय केवल रजिस्टर सेव और रीलोड करने (कॉन्टेक्स्ट स्विच) में खर्च हो जाएगा।",
            },
            { key: "B", text: "इंटरैक्टिव काम पूरी तरह रुक जाएंगे।" },
            { key: "C", text: "यह एल्गोरिदम अपने आप FCFS में बदल जाएगा।" },
          ],
          correctAnswer: "A",
          explanation:
            "अगर क्वांटम कॉन्टेक्स्ट स्विच के बराबर हो जाए, तो CPU असली काम करने के बजाय केवल प्रोसेस बदलने में ही व्यस्त रहेगा।",
        },
      },
    ];

    const chosenIndex =
      typeof preferredIndex === "number"
        ? Math.abs(preferredIndex) % challengePool.length
        : Math.floor(Math.random() * challengePool.length);
    const chosenChallenge = challengePool[chosenIndex];

    return {
      conceptName,
      intuition: intuitionEn,
      analogy: analogyEn,
      anchorEn,
      anchorHi,
      vernacularAnchor: anchorHi,
      quickCheck: chosenChallenge.en,
      en: {
        intuition: intuitionEn,
        analogy: analogyEn,
        anchor: anchorEn,
        quickCheck: chosenChallenge.en,
      },
      hi: {
        intuition: intuitionHi,
        analogy: analogyHi,
        anchor: anchorHi,
        quickCheck: chosenChallenge.hi,
      },
      challengePool,
    };
  }

  // 5. Database Normalization
  if (lower.includes("normaliz") || lower.includes("relation")) {
    const anchorEn =
      "Remember: Normalization eliminates write anomalies by ensuring each fact lives in exactly one place; denormalization is an intentional read-speed trade-off.";
    const anchorHi =
      "याद रखें: Normalization डेटा दोहराव और विसंगति मिटाता है — हर जानकारी सिर्फ एक ही जगह दर्ज होनी चाहिए।";

    const intuitionEn =
      "Database Normalization organizes relational schemas to eliminate insert, update, and deletion anomalies by ensuring non-key attributes depend strictly on candidate keys.";
    const intuitionHi =
      "डेटाबेस नॉर्मलाइज़ेशन टेबल्स को ऐसे व्यवस्थित करता है कि एक ही जानकारी बार-बार न लिखनी पड़े, ताकि अपडेट करते समय डेटा विसंगति से बचा जा सके।";

    const analogyEn =
      "Like organizing a messy toolbox: putting wrenches, screws, and drills into dedicated labeled compartments so updating a part number doesn't miss old inventory.";
    const analogyHi =
      "जैसे अलमारी को व्यवस्थित करना: हर चीज़ की अपनी तय जगह होती है ताकि एक जगह बदलाव करने पर पूरी अलमारी में भ्रम न फैले।";

    const challengePool: BilingualChallenge[] = [
      {
        en: {
          question:
            "A schema is decomposed from 3NF into Boyce-Codd Normal Form (BCNF). What critical capability might be lost during this transition?",
          options: [
            {
              key: "A",
              text: "Dependency preservation: validating certain functional dependencies may now require expensive joins across multiple tables.",
            },
            { key: "B", text: "Lossless join decomposition is impossible in BCNF." },
            { key: "C", text: "Tables in BCNF cannot support foreign keys." },
          ],
          correctAnswer: "A",
          explanation:
            "BCNF guarantees zero redundancy from functional dependencies, but unlike 3NF, BCNF cannot always preserve all functional dependencies without cross-table joins.",
        },
        hi: {
          question:
            "एक रिलेशनल स्कीमा को 3NF से BCNF में बदला जाता है। इस प्रक्रिया में कौन सी महत्वपूर्ण क्षमता खो सकती है?",
          options: [
            {
              key: "A",
              text: "डिपेंडेंसी प्रिजर्वेशन: कुछ फंक्शनल डिपेंडेंसी को जांचने के लिए अब कई टेबल्स को जॉइन करना पड़ सकता है।",
            },
            { key: "B", text: "BCNF में लॉसलेस जॉइन असंभव हो जाता है।" },
            { key: "C", text: "BCNF टेबल्स में फॉरेन की नहीं बनाई जा सकती।" },
          ],
          correctAnswer: "A",
          explanation:
            "BCNF अतिरेक (redundancy) तो पूरी तरह मिटा देता है, लेकिन 3NF की तरह यह हमेशा सभी डिपेंडेंसी को बिना जॉइन के सुरक्षित रखने की गारंटी नहीं दे सकता।",
        },
      },
    ];

    const chosenIndex =
      typeof preferredIndex === "number"
        ? Math.abs(preferredIndex) % challengePool.length
        : Math.floor(Math.random() * challengePool.length);
    const chosenChallenge = challengePool[chosenIndex];

    return {
      conceptName,
      intuition: intuitionEn,
      analogy: analogyEn,
      anchorEn,
      anchorHi,
      vernacularAnchor: anchorHi,
      quickCheck: chosenChallenge.en,
      en: {
        intuition: intuitionEn,
        analogy: analogyEn,
        anchor: anchorEn,
        quickCheck: chosenChallenge.en,
      },
      hi: {
        intuition: intuitionHi,
        analogy: analogyHi,
        anchor: anchorHi,
        quickCheck: chosenChallenge.hi,
      },
      challengePool,
    };
  }

  // 6. Generic STEM Concept Fallback with Bilingual Structure
  const anchorEn = `Remember: ${conceptName} establishes the invariant rules that downstream systems assume to be permanently true.`;
  const anchorHi = `याद रखें: ${conceptName} एक बुनियादी नियम की तरह है — अगर यह मजबूत है तो आगे का पूरा विषय आसान हो जाएगा।`;
  const intuitionEn = description
    ? `${conceptName} solves foundational engineering challenges: ${description}. Understanding its internal contract is critical before building higher abstractions.`
    : `${conceptName} provides the structural foundation required for downstream systems. Mastering its core rules prevents subtle edge-case failures in production.`;
  const intuitionHi = description
    ? `${conceptName} महत्वपूर्ण इंजीनियरिंग समस्याओं का समाधान करता है: ${description}। आगे के विषयों को समझने से पहले इसकी बुनियादी कार्यप्रणाली को समझना अनिवार्य है।`
    : `${conceptName} उच्च-स्तरीय प्रणालियों के लिए आवश्यक नींव प्रदान करता है। इसके मुख्य नियमों को समझना सिस्टम में होने वाली अप्रत्याशित गलतियों को रोकता है।`;
  const analogyEn = `Think of ${conceptName} like the bedrock foundation pillars of a skyscraper: any hidden flaw here propagates upward and compromises the entire structure.`;
  const analogyHi = `इसे एक बहुमंजिला इमारत की नींव के खंभे की तरह समझें: यदि नींव में कोई कमजोरी रह जाए, तो ऊपर बनी पूरी इमारत अस्थिर हो जाती है।`;

  const genericChallenge: BilingualChallenge = {
    en: {
      question: `In a production system built upon ${conceptName}, an engineer observes failure under unexpected load. What is the most likely architectural root cause?`,
      options: [
        {
          key: "A",
          text: `A violation of an invariant assumption or boundary constraint guaranteed by ${conceptName}.`,
        },
        { key: "B", text: "The programming language compiler generated incorrect bytecode." },
        { key: "C", text: "Theoretical principles do not apply to real production software." },
      ],
      correctAnswer: "A",
      explanation: `Foundational concepts define the invariant contracts; edge-case failures almost always trace back to unhandled boundary conditions.`,
    },
    hi: {
      question: `${conceptName} पर आधारित एक लाइव सिस्टम में भारी लोड के दौरान विफलता देखी जाती है। इसका सबसे संभावित मूल कारण क्या है?`,
      options: [
        {
          key: "A",
          text: `${conceptName} द्वारा तय की गई सीमा शर्तों (Boundary Constraints) या बुनियादी नियमों का उल्लंघन होना।`,
        },
        { key: "B", text: "कंपाइलर ने कोड को गलत तरीके से ट्रांसलेट किया।" },
        { key: "C", text: "सैद्धांतिक नियम असल सॉफ्टवेयर में काम नहीं करते।" },
      ],
      correctAnswer: "A",
      explanation: `बुनियादी सिद्धांत ही सिस्टम के नियम तय करते हैं; सिस्टम में आने वाली गलतियाँ लगभग हमेशा अनियंत्रित सीमाओं (boundary cases) से उत्पन्न होती हैं।`,
    },
  };

  return {
    conceptName,
    intuition: intuitionEn,
    analogy: analogyEn,
    anchorEn,
    anchorHi,
    vernacularAnchor: anchorHi,
    quickCheck: genericChallenge.en,
    en: {
      intuition: intuitionEn,
      analogy: analogyEn,
      anchor: anchorEn,
      quickCheck: genericChallenge.en,
    },
    hi: {
      intuition: intuitionHi,
      analogy: analogyHi,
      anchor: anchorHi,
      quickCheck: genericChallenge.hi,
    },
    challengePool: [genericChallenge],
  };
}

