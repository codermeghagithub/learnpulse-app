/**
 * Object-Oriented Programming (OOPs) Seed Data
 * Prerequisite Chain:
 *   Classes & Objects → Inheritance → Polymorphism → Abstraction
 *   Inheritance → Interfaces
 */

export const oopsCourse = {
  title: "Object-Oriented Programming",
  subject: "Computer Science",
  concepts: [
    {
      key: "classes-objects",
      name: "Classes & Objects",
      difficulty: "easy",
      description: "Encapsulation, constructors, instantiating objects, this pointer, and member access specifiers.",
    },
    {
      key: "inheritance",
      name: "Inheritance",
      difficulty: "medium",
      description: "Code reuse via is-a hierarchies: single, multiple, hierarchical, and method overriding.",
    },
    {
      key: "polymorphism",
      name: "Polymorphism",
      difficulty: "medium",
      description: "Compile-time (overloading) vs runtime polymorphism (virtual functions and dynamic dispatch via vtable).",
    },
    {
      key: "abstraction",
      name: "Abstraction",
      difficulty: "hard",
      description: "Hiding internal implementation details: abstract classes, pure virtual methods, and contract-based design.",
    },
    {
      key: "interfaces",
      name: "Interfaces",
      difficulty: "medium",
      description: "Pure contracts, default methods, multiple interface implementation, and decoupling components.",
    },
  ],
  edges: [
    { from: "classes-objects", to: "inheritance", weight: 2 },
    { from: "inheritance", to: "polymorphism", weight: 2 },
    { from: "polymorphism", to: "abstraction", weight: 3 },
    { from: "inheritance", to: "interfaces", weight: 2 },
  ],
  questions: {
    "classes-objects": [
      {
        question_text: "What OOP concept binds data members and functions operating on that data into a single cohesive unit while restricting direct outside access?",
        options: [
          { key: "A", text: "Polymorphism" },
          { key: "B", text: "Encapsulation" },
          { key: "C", text: "Inheritance" },
          { key: "D", text: "Dynamic Binding" },
        ],
        correct_answer: "B",
        explanation: "Encapsulation bundles data with code methods and protects internal object state through access specifiers (private/protected).",
        difficulty: "easy",
      },
      {
        question_text: "When is a default constructor invoked in object-oriented languages?",
        options: [
          { key: "A", text: "When an object is explicitly cast to another type" },
          { key: "B", text: "When an object is instantiated without passing arguments" },
          { key: "C", text: "When an object is destroyed from memory" },
          { key: "D", text: "When a method is called recursively" },
        ],
        correct_answer: "B",
        explanation: "The default constructor is automatically called when an object instance is created without supplying constructor arguments.",
        difficulty: "easy",
      },
    ],
    inheritance: [
      {
        question_text: "In the context of inheritance, the 'Diamond Problem' is caused by:",
        options: [
          { key: "A", text: "Deep single inheritance chains exceeding stack limits" },
          { key: "B", text: "Multiple inheritance where a class inherits from two classes that both inherit from the same common base" },
          { key: "C", text: "Making a base class destructor private" },
          { key: "D", text: "Instantiating an interface directly" },
        ],
        correct_answer: "B",
        explanation: "The Diamond Problem arises when a class inherits from two parent classes that share a common ancestor, causing ambiguity in method resolution.",
        difficulty: "medium",
      },
      {
        question_text: "What access specifier allows member variables to be accessed by derived subclasses, but denies access to arbitrary external code?",
        options: [
          { key: "A", text: "private" },
          { key: "B", text: "protected" },
          { key: "C", text: "public" },
          { key: "D", text: "internal" },
        ],
        correct_answer: "B",
        explanation: "Protected members are accessible within the defining class and all derived classes, but hidden from outside clients.",
        difficulty: "medium",
      },
    ],
    polymorphism: [
      {
        question_text: "How do compilers and runtimes typically implement dynamic (runtime) polymorphism for virtual functions?",
        options: [
          { key: "A", text: "Linear search through source code files" },
          { key: "B", text: "Virtual Method Table (vtable) with function pointers" },
          { key: "C", text: "Switch-case statements generated at compile time" },
          { key: "D", text: "Heap allocation on every method invocation" },
        ],
        correct_answer: "B",
        explanation: "Dynamic dispatch uses a hidden vtable pointer inside each object pointing to a table of function pointers resolved at runtime.",
        difficulty: "medium",
      },
      {
        question_text: "Which of the following is an example of compile-time (static) polymorphism?",
        options: [
          { key: "A", text: "Method Overriding with virtual methods" },
          { key: "B", text: "Method Overloading and Operator Overloading" },
          { key: "C", text: "Interface implementation" },
          { key: "D", text: "Dynamic type casting" },
        ],
        correct_answer: "B",
        explanation: "Method and operator overloading are resolved at compile time based on parameter signatures and types.",
        difficulty: "medium",
      },
    ],
    abstraction: [
      {
        question_text: "What defines an 'Abstract Class' in object-oriented design?",
        options: [
          { key: "A", text: "A class that cannot be instantiated directly and often contains one or more pure virtual/abstract methods" },
          { key: "B", text: "A class containing only static constants" },
          { key: "C", text: "A class without any member variables" },
          { key: "D", text: "A class marked as final" },
        ],
        correct_answer: "A",
        explanation: "An abstract class defines an incomplete blueprint meant to be subclassed; it cannot be instantiated directly with 'new'.",
        difficulty: "hard",
      },
      {
        question_text: "Why should base class destructors generally be declared 'virtual' in polymorphic class hierarchies?",
        options: [
          { key: "A", text: "To prevent child classes from being garbage collected" },
          { key: "B", text: "To ensure the derived class destructor is called when deleting an object through a base class pointer" },
          { key: "C", text: "To speed up heap allocation" },
          { key: "D", text: "Virtual destructors are mandatory by language syntax" },
        ],
        correct_answer: "B",
        explanation: "If a base destructor is not virtual, deleting via a base pointer only calls the base destructor, leaking derived resources.",
        difficulty: "hard",
      },
      {
        question_text: "Which SOLID design principle states that high-level modules should not depend on low-level modules, but rather both should depend on abstractions?",
        options: [
          { key: "A", text: "Single Responsibility Principle" },
          { key: "B", text: "Open/Closed Principle" },
          { key: "C", text: "Dependency Inversion Principle" },
          { key: "D", text: "Interface Segregation Principle" },
        ],
        correct_answer: "C",
        explanation: "The Dependency Inversion Principle (the 'D' in SOLID) mandates that high-level and low-level modules depend on abstractions/interfaces.",
        difficulty: "hard",
      },
    ],
    interfaces: [
      {
        question_text: "What is a key difference between an Interface and an Abstract Class in most modern OOP languages (like Java/TypeScript)?",
        options: [
          { key: "A", text: "A class can implement multiple interfaces, but typically can only inherit from one base class" },
          { key: "B", text: "Interfaces can store object state instance variables" },
          { key: "C", text: "Abstract classes cannot have constructors" },
          { key: "D", text: "Interfaces are only checked at runtime" },
        ],
        correct_answer: "A",
        explanation: "Interfaces allow multiple contract implementations without the baggage and diamond issues of multiple class state inheritance.",
        difficulty: "medium",
      },
      {
        question_text: "According to the Interface Segregation Principle (ISP), how should interfaces be designed?",
        options: [
          { key: "A", text: "A single monolithic interface containing all system functions" },
          { key: "B", text: "Clients should not be forced to depend on interfaces they do not use; use small, focused interfaces" },
          { key: "C", text: "Interfaces must always extend other interfaces" },
          { key: "D", text: "Interfaces should only declare setter methods" },
        ],
        correct_answer: "B",
        explanation: "ISP states that no client should be forced to depend on methods it does not use, favoring granular, role-specific interfaces.",
        difficulty: "medium",
      },
    ],
  },
};
