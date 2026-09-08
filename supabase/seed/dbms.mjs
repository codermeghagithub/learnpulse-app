/**
 * Database Management Systems (DBMS) Seed Data
 * Prerequisite Chain:
 *   ER Model → Relational Model → Normalization → SQL Joins
 *   Relational Model → Transactions
 */

export const dbmsCourse = {
  title: "Database Management Systems",
  subject: "Computer Science",
  concepts: [
    {
      key: "er-model",
      name: "ER Model",
      difficulty: "easy",
      description: "Conceptual database modeling: entities, attributes, relationships, cardinalities, and ER diagrams.",
    },
    {
      key: "relational-model",
      name: "Relational Model",
      difficulty: "easy",
      description: "Tables, primary keys, foreign keys, integrity constraints, and relational algebra operations.",
    },
    {
      key: "normalization",
      name: "Normalization",
      difficulty: "medium",
      description: "Eliminating redundancy: functional dependencies, 1NF, 2NF, 3NF, and BCNF.",
    },
    {
      key: "sql-joins",
      name: "SQL Joins",
      difficulty: "medium",
      description: "INNER, LEFT OUTER, RIGHT OUTER, FULL OUTER, and CROSS joins across relational tables.",
    },
    {
      key: "transactions",
      name: "Transactions",
      difficulty: "hard",
      description: "ACID properties, serializability, conflict serializability, 2PL (Two-Phase Locking), and WAL.",
    },
  ],
  edges: [
    { from: "er-model", to: "relational-model", weight: 2 },
    { from: "relational-model", to: "normalization", weight: 3 },
    { from: "normalization", to: "sql-joins", weight: 2 },
    { from: "relational-model", to: "transactions", weight: 3 },
  ],
  questions: {
    "er-model": [
      {
        question_text: "In an Entity-Relationship (ER) diagram, which geometric shape represents an entity set?",
        options: [
          { key: "A", text: "Ellipse" },
          { key: "B", text: "Diamond" },
          { key: "C", text: "Rectangle" },
          { key: "D", text: "Double Ellipse" },
        ],
        correct_answer: "C",
        explanation: "In standard Chen ER notation, Rectangles represent Entity Sets, Diamonds represent Relationships, and Ellipses represent Attributes.",
        difficulty: "easy",
      },
      {
        question_text: "What defines a 'Weak Entity' in an ER model?",
        options: [
          { key: "A", text: "An entity with no relationships" },
          { key: "B", text: "An entity whose existence depends on an identifying owner entity and lacks a primary key of its own" },
          { key: "C", text: "An entity that only contains numeric attributes" },
          { key: "D", text: "An entity mapped to a temporary database view" },
        ],
        correct_answer: "B",
        explanation: "A weak entity cannot be uniquely identified by its own attributes alone and relies on an identifying relationship with a strong entity.",
        difficulty: "easy",
      },
    ],
    "relational-model": [
      {
        question_text: "Which integrity constraint enforces that a foreign key value must match an existing primary key value in the referenced table, or be NULL?",
        options: [
          { key: "A", text: "Entity Integrity" },
          { key: "B", text: "Referential Integrity" },
          { key: "C", text: "Domain Integrity" },
          { key: "D", text: "Key Integrity" },
        ],
        correct_answer: "B",
        explanation: "Referential integrity requires that any foreign-key field value must correspond to a valid primary key in the referenced relation.",
        difficulty: "easy",
      },
      {
        question_text: "In relational algebra, which operator filters rows from a relation based on a specified predicate condition?",
        options: [
          { key: "A", text: "Projection (π)" },
          { key: "B", text: "Selection (σ)" },
          { key: "C", text: "Cartesian Product (×)" },
          { key: "D", text: "Join (⋈)" },
        ],
        correct_answer: "B",
        explanation: "Selection (σ) chooses tuples (rows) that satisfy a given condition, whereas Projection (π) selects specific columns.",
        difficulty: "easy",
      },
    ],
    normalization: [
      {
        question_text: "A relation is in Second Normal Form (2NF) if and only if it is in 1NF and:",
        options: [
          { key: "A", text: "It contains no multi-valued dependencies" },
          { key: "B", text: "Every non-prime attribute is fully functionally dependent on every candidate key" },
          { key: "C", text: "Every determinant is a candidate key" },
          { key: "D", text: "It contains no transitive dependencies" },
        ],
        correct_answer: "B",
        explanation: "2NF eliminates partial dependencies: no non-prime attribute may depend on only a proper subset of a composite candidate key.",
        difficulty: "medium",
      },
      {
        question_text: "Under Boyce-Codd Normal Form (BCNF), for every non-trivial functional dependency X → Y:",
        options: [
          { key: "A", text: "Y must be a prime attribute" },
          { key: "B", text: "X must be a superkey" },
          { key: "C", text: "X must be a single attribute" },
          { key: "D", text: "Y must not be NULL" },
        ],
        correct_answer: "B",
        explanation: "BCNF is stricter than 3NF: for every non-trivial functional dependency X → Y, the determinant X must be a superkey.",
        difficulty: "medium",
      },
    ],
    "sql-joins": [
      {
        question_text: "Which SQL join returns all records from the left table, and matched records from the right table (filling with NULL if no match exists)?",
        options: [
          { key: "A", text: "INNER JOIN" },
          { key: "B", text: "LEFT OUTER JOIN" },
          { key: "C", text: "CROSS JOIN" },
          { key: "D", text: "NATURAL JOIN" },
        ],
        correct_answer: "B",
        explanation: "LEFT OUTER JOIN returns all rows from the left table, plus matched rows from the right table. Where no match exists, NULL is substituted.",
        difficulty: "medium",
      },
      {
        question_text: "If Table A contains 5 rows and Table B contains 4 rows, how many rows are produced by 'SELECT * FROM A CROSS JOIN B'?",
        options: [
          { key: "A", text: "9" },
          { key: "B", text: "20" },
          { key: "C", text: "4" },
          { key: "D", text: "5" },
        ],
        correct_answer: "B",
        explanation: "A CROSS JOIN produces the Cartesian product of the two tables: 5 × 4 = 20 rows.",
        difficulty: "medium",
      },
      {
        question_text: "What is the difference between WHERE and ON clauses when performing a LEFT JOIN in SQL?",
        options: [
          { key: "A", text: "They are completely identical in execution" },
          { key: "B", text: "The ON clause filters rows before the join, while the WHERE clause filters the result set after the join" },
          { key: "C", text: "ON can only be used with primary keys" },
          { key: "D", text: "WHERE is evaluated before the tables are scanned" },
        ],
        correct_answer: "B",
        explanation: "In outer joins, ON determines which rows match for the join (preserving unmatched left rows), whereas WHERE filters the combined output after join generation.",
        difficulty: "hard",
      },
    ],
    transactions: [
      {
        question_text: "Which ACID property guarantees that all operations of a transaction complete successfully, or all are completely undone in case of failure?",
        options: [
          { key: "A", text: "Atomicity" },
          { key: "B", text: "Consistency" },
          { key: "C", text: "Isolation" },
          { key: "D", text: "Durability" },
        ],
        correct_answer: "A",
        explanation: "Atomicity ensures 'all-or-nothing' execution of transaction operations.",
        difficulty: "hard",
      },
      {
        question_text: "In Two-Phase Locking (2PL), once a transaction releases any lock, it enters the shrinking phase and:",
        options: [
          { key: "A", text: "Can immediately acquire shared locks" },
          { key: "B", text: "Cannot obtain any new locks" },
          { key: "C", text: "Must immediately abort" },
          { key: "D", text: "Must commit within 10ms" },
        ],
        correct_answer: "B",
        explanation: "The core rule of 2PL: a transaction cannot acquire any new lock once it has begun releasing locks (shrinking phase).",
        difficulty: "hard",
      },
    ],
  },
};
