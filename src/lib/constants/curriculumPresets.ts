export interface CurriculumPreset {
  name: string;
  text: string;
}

export const CURRICULUM_PRESETS: CurriculumPreset[] = [
  {
    name: "Artificial Intelligence",
    text: "Artificial Intelligence: State Space Search, Heuristic Search (A*), Minimax & Alpha-Beta Pruning, Constraint Satisfaction, Propositional Logic, Knowledge Representation, Machine Learning Basics",
  },
  {
    name: "Data Mining and Warehousing",
    text: "Data Mining and Warehousing: Data Preprocessing, Data Warehousing & OLAP, Association Rule Mining (Apriori), Classification (Decision Trees), Cluster Analysis (K-Means), Outlier Detection",
  },
  {
    name: "Operating Systems",
    text: "Operating Systems: Process Scheduling, Concurrency & Synchronization, Deadlock Prevention, Memory Management & Paging, Virtual Memory, File Systems",
  },
  {
    name: "Database Management Systems",
    text: "Database Management Systems: Relational Model, SQL Queries, Schema Normalization (1NF-BCNF), Transaction ACID, Concurrency Control, Indexing & B+ Trees",
  },
  {
    name: "Computer Networks",
    text: "Computer Networks: OSI Model, Data Link Framing, IP Addressing & Subnetting, Routing Protocols, TCP/UDP Transport, Congestion Control, DNS & HTTP",
  },
  {
    name: "Data Structures & Algorithms",
    text: "Data Structures and Algorithms: Asymptotic Complexity & Arrays, Linked Lists, Stacks & Queues, Recursion & Backtracking, Binary Search Trees, Binary Heaps & Priority Queues, Hash Tables, Graph Traversals (BFS/DFS), Shortest Path Algorithms, Dynamic Programming",
  },
];
