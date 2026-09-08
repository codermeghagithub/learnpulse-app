/**
 * Operating Systems Seed Data
 * Prerequisite Chain:
 *   Processes → Threads → Scheduling → Deadlocks
 *   Processes → Memory Management
 */

export const osCourse = {
  title: "Operating Systems",
  subject: "Computer Science",
  concepts: [
    {
      key: "processes",
      name: "Processes",
      difficulty: "easy",
      description: "A program in execution containing program counter, stack, data, and PCB.",
    },
    {
      key: "threads",
      name: "Threads",
      difficulty: "medium",
      description: "Lightweight execution units within a process sharing code, data, and open files.",
    },
    {
      key: "scheduling",
      name: "CPU Scheduling",
      difficulty: "medium",
      description: "Mechanisms to allocate CPU time across ready processes (FCFS, SJF, Round Robin).",
    },
    {
      key: "deadlocks",
      name: "Deadlocks",
      difficulty: "hard",
      description: "Resource deadlock states, four Coffman conditions, avoidance via Banker's algorithm.",
    },
    {
      key: "memory-management",
      name: "Memory Management",
      difficulty: "hard",
      description: "Address binding, paging, virtual memory, TLB, and page replacement policies.",
    },
  ],
  edges: [
    { from: "processes", to: "threads", weight: 2 },
    { from: "threads", to: "scheduling", weight: 2 },
    { from: "scheduling", to: "deadlocks", weight: 3 },
    { from: "processes", to: "memory-management", weight: 2 },
  ],
  questions: {
    processes: [
      {
        question_text: "What structure does the OS kernel maintain to store process state, program counter, and registers?",
        options: [
          { key: "A", text: "Page Table Entry (PTE)" },
          { key: "B", text: "Process Control Block (PCB)" },
          { key: "C", text: "Inode Table" },
          { key: "D", text: "Translation Lookaside Buffer (TLB)" },
        ],
        correct_answer: "B",
        explanation: "The Process Control Block (PCB) contains all bookkeeping information needed by the OS to manage a specific process.",
        difficulty: "easy",
      },
      {
        question_text: "Which process state transition occurs when a running process initiates an I/O request?",
        options: [
          { key: "A", text: "Running → Ready" },
          { key: "B", text: "Ready → Running" },
          { key: "C", text: "Running → Waiting / Blocked" },
          { key: "D", text: "Waiting → Terminated" },
        ],
        correct_answer: "C",
        explanation: "When a process initiates an I/O operation or waits for an event, it voluntarily transitions from Running to Waiting/Blocked.",
        difficulty: "easy",
      },
    ],
    threads: [
      {
        question_text: "What resource is uniquely private to each individual thread within the same process?",
        options: [
          { key: "A", text: "Global Variables / Data segment" },
          { key: "B", text: "Heap memory" },
          { key: "C", text: "Open file descriptors" },
          { key: "D", text: "Registers and Call Stack" },
        ],
        correct_answer: "D",
        explanation: "Threads share address space, code, and heap, but maintain their own program counters, register sets, and call stacks.",
        difficulty: "medium",
      },
      {
        question_text: "Why is context switching between kernel-level threads within the same process typically faster than between separate processes?",
        options: [
          { key: "A", text: "Threads do not require CPU registers" },
          { key: "B", text: "Address space and virtual memory mappings do not need to be switched" },
          { key: "C", text: "Threads run in kernel mode only" },
          { key: "D", text: "Threads bypass the OS scheduler" },
        ],
        correct_answer: "B",
        explanation: "Because threads share the same address space, page table pointers do not need to be swapped and TLB flushes are avoided.",
        difficulty: "medium",
      },
    ],
    scheduling: [
      {
        question_text: "Which CPU scheduling algorithm can suffer from the 'convoy effect' where short processes wait behind a long process?",
        options: [
          { key: "A", text: "First-Come, First-Served (FCFS)" },
          { key: "B", text: "Shortest Remaining Time First (SRTF)" },
          { key: "C", text: "Round Robin (RR)" },
          { key: "D", text: "Multilevel Feedback Queue" },
        ],
        correct_answer: "A",
        explanation: "In non-preemptive FCFS, if a CPU-bound process with a huge burst arrives first, all short I/O-bound jobs behind it stall, creating a convoy effect.",
        difficulty: "medium",
      },
      {
        question_text: "In Round Robin scheduling, what is the consequence of choosing an excessively large time quantum?",
        options: [
          { key: "A", text: "Excessive context switching overhead" },
          { key: "B", text: "Algorithm degenerates to FCFS" },
          { key: "C", text: "Starvation of long-running processes" },
          { key: "D", text: "High probability of deadlocks" },
        ],
        correct_answer: "B",
        explanation: "If the quantum is larger than any process's CPU burst, every process finishes before its slice expires, making it behave like FCFS.",
        difficulty: "medium",
      },
      {
        question_text: "Which scheduling algorithm provably gives the minimum average waiting time for a given set of stationary processes?",
        options: [
          { key: "A", text: "Priority Scheduling" },
          { key: "B", text: "Shortest Job First (SJF)" },
          { key: "C", text: "Round Robin" },
          { key: "D", text: "Earliest Deadline First" },
        ],
        correct_answer: "B",
        explanation: "SJF (and its preemptive variant SRTF) is mathematically optimal with respect to minimizing average waiting time.",
        difficulty: "hard",
      },
    ],
    deadlocks: [
      {
        question_text: "Which of the following is NOT one of Coffman's four necessary conditions for deadlock?",
        options: [
          { key: "A", text: "Mutual Exclusion" },
          { key: "B", text: "Hold and Wait" },
          { key: "C", text: "Preemption of Resources" },
          { key: "D", text: "Circular Wait" },
        ],
        correct_answer: "C",
        explanation: "The condition is NO preemption. If resources can be preempted from holding processes, deadlocks cannot persist.",
        difficulty: "hard",
      },
      {
        question_text: "What is the primary role of the Banker's Algorithm in an operating system?",
        options: [
          { key: "A", text: "Deadlock Detection" },
          { key: "B", text: "Deadlock Avoidance by ensuring safe state transitions" },
          { key: "C", text: "Deadlock Prevention by eliminating Mutual Exclusion" },
          { key: "D", text: "Memory Compaction" },
        ],
        correct_answer: "B",
        explanation: "The Banker's Algorithm tests for safety by simulating the allocation of maximum possible predetermined amounts of all resources.",
        difficulty: "hard",
      },
    ],
    "memory-management": [
      {
        question_text: "What hardware component caches virtual-to-physical address translations to accelerate memory access in paging systems?",
        options: [
          { key: "A", text: "Instruction Register" },
          { key: "B", text: "Translation Lookaside Buffer (TLB)" },
          { key: "C", text: "Memory Data Register" },
          { key: "D", text: "Disk Cache" },
        ],
        correct_answer: "B",
        explanation: "The TLB is an associative, high-speed hardware cache that stores recent virtual page number to physical frame translations.",
        difficulty: "hard",
      },
      {
        question_text: "Belady's Anomaly occurs in FIFO page replacement when:",
        options: [
          { key: "A", text: "Decreasing the number of page frames decreases page faults" },
          { key: "B", text: "Increasing the number of page frames causes more page faults" },
          { key: "C", text: "LRU performs worse than Random replacement" },
          { key: "D", text: "The working set exceeds physical memory" },
        ],
        correct_answer: "B",
        explanation: "Belady's Anomaly is the counterintuitive phenomenon where giving a process more page frames actually results in an increased number of page faults under FIFO.",
        difficulty: "hard",
      },
    ],
  },
};
