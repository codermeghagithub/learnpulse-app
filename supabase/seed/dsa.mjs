/**
 * Data Structures & Algorithms (DSA) Seed Data
 */

export const dsaCourse = {
  title: "Data Structures & Algorithms",
  subject: "Computer Science",
  concepts: [
    { key: "arrays", name: "Arrays", difficulty: "easy", description: "Fundamental data structure: indexed collection of elements" },
    { key: "linked-lists", name: "Linked Lists", difficulty: "medium", description: "Dynamic data structure with nodes and pointers" },
    { key: "stacks", name: "Stacks", difficulty: "medium", description: "LIFO data structure built on arrays or linked lists" },
    { key: "recursion", name: "Recursion", difficulty: "hard", description: "Functions calling themselves to solve sub-problems" },
    { key: "trees", name: "Trees", difficulty: "hard", description: "Hierarchical data structure with nodes and edges" },
    { key: "graphs", name: "Graphs", difficulty: "hard", description: "General structure with vertices and edges, models networks" },
    { key: "sorting", name: "Sorting", difficulty: "medium", description: "Algorithms to arrange elements in order" },
    { key: "searching", name: "Searching", difficulty: "medium", description: "Binary search and linear search algorithms" },
  ],
  edges: [
    { from: "arrays", to: "linked-lists", weight: 2 },
    { from: "linked-lists", to: "stacks", weight: 2 },
    { from: "stacks", to: "recursion", weight: 3 },
    { from: "recursion", to: "trees", weight: 3 },
    { from: "trees", to: "graphs", weight: 2 },
    { from: "arrays", to: "sorting", weight: 2 },
    { from: "arrays", to: "searching", weight: 1 },
  ],
  questions: {
    arrays: [
      {
        question_text: "What is the time complexity of accessing an element by index in an array?",
        options: [{ key: "A", text: "O(1)" }, { key: "B", text: "O(n)" }, { key: "C", text: "O(log n)" }, { key: "D", text: "O(n²)" }],
        correct_answer: "A",
        explanation: "Arrays provide O(1) random access because elements are stored in contiguous memory and the address is computed directly from the index.",
        difficulty: "easy",
      },
      {
        question_text: "If an array has n elements, what is the index of the last element?",
        options: [{ key: "A", text: "n" }, { key: "B", text: "n+1" }, { key: "C", text: "n-1" }, { key: "D", text: "n/2" }],
        correct_answer: "C",
        explanation: "Arrays are 0-indexed, so the first element is at index 0 and the last is at index n-1.",
        difficulty: "easy",
      },
      {
        question_text: "What is the time complexity of inserting an element at the beginning of an array?",
        options: [{ key: "A", text: "O(1)" }, { key: "B", text: "O(n)" }, { key: "C", text: "O(log n)" }, { key: "D", text: "O(n log n)" }],
        correct_answer: "B",
        explanation: "Inserting at the beginning requires shifting all n existing elements one position to the right.",
        difficulty: "medium",
      },
    ],
    "linked-lists": [
      {
        question_text: "What does each node in a singly linked list contain?",
        options: [{ key: "A", text: "Data only" }, { key: "B", text: "Data and one pointer to the next node" }, { key: "C", text: "Data and two pointers" }, { key: "D", text: "Only a pointer" }],
        correct_answer: "B",
        explanation: "A singly linked list node stores data and a pointer (reference) to the next node in the list.",
        difficulty: "easy",
      },
      {
        question_text: "What is the time complexity of searching for an element in a singly linked list?",
        options: [{ key: "A", text: "O(1)" }, { key: "B", text: "O(log n)" }, { key: "C", text: "O(n)" }, { key: "D", text: "O(n²)" }],
        correct_answer: "C",
        explanation: "In the worst case, we must traverse all n nodes to find the element or determine it doesn't exist.",
        difficulty: "medium",
      },
    ],
    stacks: [
      {
        question_text: "Which principle does a stack follow?",
        options: [{ key: "A", text: "FIFO (First In, First Out)" }, { key: "B", text: "LIFO (Last In, First Out)" }, { key: "C", text: "Random access" }, { key: "D", text: "Priority order" }],
        correct_answer: "B",
        explanation: "A stack follows the LIFO principle — the last element pushed is the first one popped.",
        difficulty: "easy",
      },
      {
        question_text: "Which data structure is naturally used to implement function call tracking in programs?",
        options: [{ key: "A", text: "Queue" }, { key: "B", text: "Array" }, { key: "C", text: "Stack" }, { key: "D", text: "Tree" }],
        correct_answer: "C",
        explanation: "The call stack is a stack — each function call pushes a frame, and returns pop the frame.",
        difficulty: "medium",
      },
    ],
    recursion: [
      {
        question_text: "What is a base case in recursion?",
        options: [{ key: "A", text: "The first recursive call" }, { key: "B", text: "The condition that stops the recursion" }, { key: "C", text: "The largest sub-problem" }, { key: "D", text: "The return value" }],
        correct_answer: "B",
        explanation: "The base case is the terminating condition — when reached, the function returns without making another recursive call.",
        difficulty: "easy",
      },
      {
        question_text: "What happens if a recursive function has no base case?",
        options: [{ key: "A", text: "It returns 0" }, { key: "B", text: "It runs once" }, { key: "C", text: "Stack overflow" }, { key: "D", text: "It returns null" }],
        correct_answer: "C",
        explanation: "Without a base case, the function calls itself infinitely, eventually exhausting the call stack.",
        difficulty: "medium",
      },
      {
        question_text: "What is the time complexity of computing Fibonacci(n) with naive recursion?",
        options: [{ key: "A", text: "O(n)" }, { key: "B", text: "O(n log n)" }, { key: "C", text: "O(2ⁿ)" }, { key: "D", text: "O(log n)" }],
        correct_answer: "C",
        explanation: "Naive recursive Fibonacci creates an exponential number of calls because it recomputes sub-problems.",
        difficulty: "hard",
      },
    ],
    trees: [
      {
        question_text: "In a binary search tree, where are values smaller than the root stored?",
        options: [{ key: "A", text: "Right subtree" }, { key: "B", text: "Left subtree" }, { key: "C", text: "Root level only" }, { key: "D", text: "Randomly" }],
        correct_answer: "B",
        explanation: "BST property: all values in the left subtree are less than the root, right subtree values are greater.",
        difficulty: "easy",
      },
      {
        question_text: "What is the height of a perfectly balanced binary tree with n nodes?",
        options: [{ key: "A", text: "O(n)" }, { key: "B", text: "O(log n)" }, { key: "C", text: "O(n²)" }, { key: "D", text: "O(1)" }],
        correct_answer: "B",
        explanation: "A balanced binary tree has height O(log n), which is why balanced BST operations are O(log n).",
        difficulty: "medium",
      },
    ],
    graphs: [
      {
        question_text: "In BFS (Breadth-First Search), which data structure is used?",
        options: [{ key: "A", text: "Stack" }, { key: "B", text: "Priority Queue" }, { key: "C", text: "Queue" }, { key: "D", text: "Array" }],
        correct_answer: "C",
        explanation: "BFS uses a queue to process nodes level by level — FIFO ensures we explore all nodes at depth k before depth k+1.",
        difficulty: "medium",
      },
      {
        question_text: "What is the time complexity of BFS on a graph with V vertices and E edges?",
        options: [{ key: "A", text: "O(V)" }, { key: "B", text: "O(E)" }, { key: "C", text: "O(V + E)" }, { key: "D", text: "O(V × E)" }],
        correct_answer: "C",
        explanation: "BFS visits every vertex once and processes every edge once, giving O(V+E) time complexity.",
        difficulty: "hard",
      },
    ],
    sorting: [
      {
        question_text: "What is the best-case time complexity of Bubble Sort?",
        options: [{ key: "A", text: "O(n²)" }, { key: "B", text: "O(n log n)" }, { key: "C", text: "O(n)" }, { key: "D", text: "O(1)" }],
        correct_answer: "C",
        explanation: "With early termination, Bubble Sort achieves O(n) on an already-sorted array (no swaps needed).",
        difficulty: "medium",
      },
      {
        question_text: "Which sorting algorithm is NOT comparison-based?",
        options: [{ key: "A", text: "Merge Sort" }, { key: "B", text: "Quick Sort" }, { key: "C", text: "Counting Sort" }, { key: "D", text: "Heap Sort" }],
        correct_answer: "C",
        explanation: "Counting Sort uses element values as array indices, not comparisons. This lets it achieve O(n+k) time.",
        difficulty: "hard",
      },
    ],
    searching: [
      {
        question_text: "What is the time complexity of Binary Search on a sorted array?",
        options: [{ key: "A", text: "O(n)" }, { key: "B", text: "O(log n)" }, { key: "C", text: "O(1)" }, { key: "D", text: "O(n log n)" }],
        correct_answer: "B",
        explanation: "Binary search halves the search space each step, giving O(log n) time.",
        difficulty: "easy",
      },
      {
        question_text: "What prerequisite must the array satisfy before Binary Search can be applied?",
        options: [{ key: "A", text: "All elements must be positive" }, { key: "B", text: "The array must be sorted" }, { key: "C", text: "The array must have even length" }, { key: "D", text: "No duplicates" }],
        correct_answer: "B",
        explanation: "Binary Search depends on sorted order to decide which half to search. Without sorting it gives wrong results.",
        difficulty: "easy",
      },
    ],
  },
};
