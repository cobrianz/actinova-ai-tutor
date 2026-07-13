const planTemplates = [
  {
    id: "python-fundamentals",
    title: "Python Fundamentals",
    description: "Master Python from scratch — variables, control flow, functions, and OOP.",
    durationWeeks: 4,
    difficulty: "beginner",
    category: "Programming",
    icon: "🐍",
    weeks: [
      {
        title: "Getting Started with Python",
        goals: ["Install Python & set up VS Code", "Understand variables and data types", "Write your first scripts"],
        days: [
          { label: "Monday", tasks: [
            { title: "Install Python & Configure VS Code", type: "lesson", estimatedMinutes: 30, description: "Set up Python 3.x, pip, and VS Code with Python extension." },
            { title: "Python REPL & Script Basics", type: "practice", estimatedMinutes: 25, description: "Practice using the Python interpreter and running .py files." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Variables and Data Types", type: "lesson", estimatedMinutes: 35, description: "Learn int, float, str, bool, and type conversion." },
            { title: "Type Checking Exercises", type: "practice", estimatedMinutes: 20, description: "Write scripts that declare variables and verify types with type()." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "String Methods Deep Dive", type: "lesson", estimatedMinutes: 30, description: "Master string slicing, f-strings, .split(), .join(), .strip() and more." },
            { title: "String Manipulation Challenges", type: "practice", estimatedMinutes: 25, description: "Solve 10 string manipulation puzzles." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Input/Output & Formatting", type: "lesson", estimatedMinutes: 25, description: "Learn input(), print(), and advanced formatting with f-strings." },
            { title: "Mini Calculator Project", type: "project", estimatedMinutes: 40, description: "Build a calculator that takes user input and performs basic operations." },
          ]},
          { label: "Friday", tasks: [
            { title: "Week 1 Knowledge Check", type: "quiz", estimatedMinutes: 20, description: "Test your understanding of variables, types, and strings." },
            { title: "Review & Practice", type: "review", estimatedMinutes: 25, description: "Revisit tricky concepts and redo any failed exercises." },
          ]},
        ],
      },
      {
        title: "Control Flow & Logic",
        goals: ["Master conditionals and loops", "Use logical operators effectively", "Solve problems with branching logic"],
        days: [
          { label: "Monday", tasks: [
            { title: "If / Elif / Else Statements", type: "lesson", estimatedMinutes: 30, description: "Learn conditional branching and nested if-statements." },
            { title: "Conditional Logic Exercises", type: "practice", estimatedMinutes: 25, description: "Write programs with complex conditional logic." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "While Loops & Iteration", type: "lesson", estimatedMinutes: 35, description: "Understand while loops, break, continue, and pass." },
            { title: "Loop Challenge Problems", type: "practice", estimatedMinutes: 30, description: "Solve 8 problems using while loops." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "For Loops & Range", type: "lesson", estimatedMinutes: 30, description: "Master for loops, range(), enumerate(), and zip()." },
            { title: "FizzBuzz & Classic Problems", type: "practice", estimatedMinutes: 30, description: "Implement FizzBuzz, prime checker, and pattern printing." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Logical Operators & Comprehensions", type: "lesson", estimatedMinutes: 35, description: "Learn and/or/not, ternary expressions, and list comprehensions." },
            { title: "Number Guessing Game", type: "project", estimatedMinutes: 40, description: "Build a number guessing game with hints and attempt tracking." },
          ]},
          { label: "Friday", tasks: [
            { title: "Week 2 Quiz", type: "quiz", estimatedMinutes: 20, description: "Assess control flow and logic concepts." },
            { title: "Review & Consolidation", type: "review", estimatedMinutes: 25, description: "Review the week's topics and strengthen weak areas." },
          ]},
        ],
      },
      {
        title: "Functions & Modules",
        goals: ["Write reusable functions", "Understand scope and closures", "Use standard library modules"],
        days: [
          { label: "Monday", tasks: [
            { title: "Defining Functions & Parameters", type: "lesson", estimatedMinutes: 30, description: "Learn def, arguments, return values, and default parameters." },
            { title: "Function Writing Exercises", type: "practice", estimatedMinutes: 30, description: "Write 10 functions for common tasks like area, factorial, etc." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Scope, Closures & Decorators Intro", type: "lesson", estimatedMinutes: 40, description: "Understand local vs global scope, closures, and basic decorators." },
            { title: "Scope Challenge Problems", type: "practice", estimatedMinutes: 25, description: "Debug and fix scope-related issues in provided code." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Standard Library Modules", type: "lesson", estimatedMinutes: 30, description: "Explore os, sys, math, random, datetime, and collections." },
            { title: "Module Exploration Lab", type: "practice", estimatedMinutes: 30, description: "Use at least 5 standard library modules to solve practical problems." },
          ]},
          { label: "Thursday", tasks: [
            { title: "File I/O & Error Handling", type: "lesson", estimatedMinutes: 35, description: "Learn try/except, file reading/writing, and context managers." },
            { title: "File Processor Project", type: "project", estimatedMinutes: 40, description: "Build a CSV reader/writer that processes student grades." },
          ]},
          { label: "Friday", tasks: [
            { title: "Week 3 Quiz", type: "quiz", estimatedMinutes: 20, description: "Test functions, modules, and error handling knowledge." },
            { title: "Cumulative Review", type: "review", estimatedMinutes: 30, description: "Review all topics covered so far." },
          ]},
        ],
      },
      {
        title: "Object-Oriented Programming",
        goals: ["Design classes with OOP principles", "Use inheritance and polymorphism", "Build a complete OOP project"],
        days: [
          { label: "Monday", tasks: [
            { title: "Classes & Objects Fundamentals", type: "lesson", estimatedMinutes: 35, description: "Learn class definitions, __init__, self, and instance methods." },
            { title: "Class Design Practice", type: "practice", estimatedMinutes: 30, description: "Create classes for Dog, BankAccount, and Rectangle." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Inheritance & Polymorphism", type: "lesson", estimatedMinutes: 35, description: "Master class inheritance, method overriding, and super()." },
            { title: "Inheritance Hierarchy Exercise", type: "practice", estimatedMinutes: 30, description: "Build an animal hierarchy with different behaviors." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Magic Methods & Properties", type: "lesson", estimatedMinutes: 35, description: "Learn __str__, __repr__, __len__, @property, and @staticmethod." },
            { title: "Custom Objects Workshop", type: "practice", estimatedMinutes: 30, description: "Implement magic methods for a custom Vector class." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Design Patterns Intro", type: "lesson", estimatedMinutes: 30, description: "Study Singleton, Factory, and Observer patterns in Python." },
            { title: "Library Management System", type: "project", estimatedMinutes: 45, description: "Build a complete library system with books, members, and borrowing." },
          ]},
          { label: "Friday", tasks: [
            { title: "Final Assessment", type: "quiz", estimatedMinutes: 25, description: "Comprehensive quiz covering all 4 weeks." },
            { title: "Course Review & Next Steps", type: "review", estimatedMinutes: 25, description: "Review all OOP concepts and plan your learning path forward." },
          ]},
        ],
      },
    ],
  },
  {
    id: "dsa",
    title: "Data Structures & Algorithms",
    description: "Build a strong foundation in DSA — arrays, trees, graphs, and sorting.",
    durationWeeks: 6,
    difficulty: "intermediate",
    category: "Computer Science",
    icon: "🌳",
    weeks: [
      {
        title: "Arrays & Strings",
        goals: ["Master array traversal and manipulation", "Solve sliding window problems", "Understand time complexity basics"],
        days: [
          { label: "Monday", tasks: [
            { title: "Time & Space Complexity (Big-O)", type: "lesson", estimatedMinutes: 35, description: "Learn Big-O notation for time and space analysis." },
            { title: "Big-O Analysis Exercises", type: "practice", estimatedMinutes: 25, description: "Determine the time complexity of 10 code snippets." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Array Operations & Two Pointers", type: "lesson", estimatedMinutes: 35, description: "Master array traversal, insertion, deletion, and two-pointer technique." },
            { title: "Two Pointer Problems", type: "practice", estimatedMinutes: 30, description: "Solve container-with-water, two-sum sorted, and triplet sum." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Sliding Window Technique", type: "lesson", estimatedMinutes: 30, description: "Learn fixed and variable sliding window patterns." },
            { title: "Sliding Window Challenges", type: "practice", estimatedMinutes: 30, description: "Solve max sum subarray, longest substring, and anagram problems." },
          ]},
          { label: "Thursday", tasks: [
            { title: "String Manipulation Algorithms", type: "lesson", estimatedMinutes: 30, description: "Master string reversal, palindrome checks, and anagram detection." },
            { title: "String Problem Set", type: "practice", estimatedMinutes: 35, description: "Solve 12 string manipulation problems." },
          ]},
          { label: "Friday", tasks: [
            { title: "Week 1 Assessment", type: "quiz", estimatedMinutes: 25, description: "Test arrays, strings, and complexity analysis." },
            { title: "Review & Reflect", type: "review", estimatedMinutes: 25, description: "Review solutions and note patterns." },
          ]},
        ],
      },
      {
        title: "Linked Lists & Stacks",
        goals: ["Implement linked lists from scratch", "Use stacks for real problems", "Master recursion basics"],
        days: [
          { label: "Monday", tasks: [
            { title: "Singly Linked Lists", type: "lesson", estimatedMinutes: 35, description: "Understand node-based data structures and pointer manipulation." },
            { title: "Linked List Implementation", type: "practice", estimatedMinutes: 35, description: "Implement insert, delete, search, and reverse operations." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Doubly Linked Lists & Circular Lists", type: "lesson", estimatedMinutes: 30, description: "Extend linked list knowledge with doubly-linked and circular variants." },
            { title: "Merge Two Sorted Lists", type: "practice", estimatedMinutes: 30, description: "Solve the classic merge sorted lists problem iteratively and recursively." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Stack Data Structure", type: "lesson", estimatedMinutes: 30, description: "Learn stack operations, implementation with arrays and linked lists." },
            { title: "Balanced Parentheses & Stack Problems", type: "practice", estimatedMinutes: 30, description: "Solve bracket matching, next greater element, and min-stack." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Recursion Fundamentals", type: "lesson", estimatedMinutes: 40, description: "Master recursive thinking, base cases, and call stack." },
            { title: "Recursion Problem Set", type: "practice", estimatedMinutes: 35, description: "Solve factorial, Fibonacci, power sum, and permutation problems." },
          ]},
          { label: "Friday", tasks: [
            { title: "Week 2 Quiz", type: "quiz", estimatedMinutes: 20, description: "Assess linked lists, stacks, and recursion." },
            { title: "Review & Consolidation", type: "review", estimatedMinutes: 30, description: "Review all linked list and stack patterns." },
          ]},
        ],
      },
      {
        title: "Queues & Hash Tables",
        goals: ["Implement queues and deques", "Master hash table operations", "Solve frequency-based problems"],
        days: [
          { label: "Monday", tasks: [
            { title: "Queue & Deque Implementations", type: "lesson", estimatedMinutes: 30, description: "Learn queue, priority queue, and deque data structures." },
            { title: "Queue-based Problem Solving", type: "practice", estimatedMinutes: 30, description: "Implement BFS traversal and sliding window maximum with deques." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Hash Tables & Hash Maps", type: "lesson", estimatedMinutes: 35, description: "Understand hashing, collision resolution, and Python dicts." },
            { title: "Hash Map Problem Set", type: "practice", estimatedMinutes: 30, description: "Solve two-sum, group anagrams, and frequency counting." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Hashing Advanced Patterns", type: "lesson", estimatedMinutes: 30, description: "Learn rolling hash, bloom filters, and consistent hashing." },
            { title: "Anagram & Substring Problems", type: "practice", estimatedMinutes: 35, description: "Solve minimum window substring and find all anagrams." },
          ]},
          { label: "Thursday", tasks: [
            { title: "LRU Cache Implementation", type: "project", estimatedMinutes: 45, description: "Build a complete LRU Cache using hash map and doubly linked list." },
          ]},
          { label: "Friday", tasks: [
            { title: "Week 3 Quiz", type: "quiz", estimatedMinutes: 20, description: "Test queues, hash tables, and caching concepts." },
            { title: "Review & Pattern Recognition", type: "review", estimatedMinutes: 30, description: "Identify when to use queues vs stacks vs hash tables." },
          ]},
        ],
      },
      {
        title: "Trees & BSTs",
        goals: ["Traverse trees in all orders", "Implement BST operations", "Solve tree-based problems"],
        days: [
          { label: "Monday", tasks: [
            { title: "Binary Trees Fundamentals", type: "lesson", estimatedMinutes: 35, description: "Learn tree terminology, node structure, and recursive traversal." },
            { title: "Tree Traversal Implementation", type: "practice", estimatedMinutes: 30, description: "Implement in-order, pre-order, and post-order traversals." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Binary Search Trees", type: "lesson", estimatedMinutes: 35, description: "Master BST insert, search, delete, and balance concepts." },
            { title: "BST Operations Practice", type: "practice", estimatedMinutes: 30, description: "Implement a complete BST with all operations from scratch." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "BFS & Level-Order Traversal", type: "lesson", estimatedMinutes: 30, description: "Learn breadth-first search and level-order traversal using queues." },
            { title: "Tree BFS Problems", type: "practice", estimatedMinutes: 35, description: "Solve max depth, zigzag traversal, and right side view." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Balanced Trees & AVL Intro", type: "lesson", estimatedMinutes: 35, description: "Understand self-balancing trees and rotation operations." },
            { title: "Tree Path Problems", type: "project", estimatedMinutes: 40, description: "Solve path sum, lowest common ancestor, and diameter problems." },
          ]},
          { label: "Friday", tasks: [
            { title: "Week 4 Quiz", type: "quiz", estimatedMinutes: 25, description: "Test tree traversal and BST knowledge." },
            { title: "Review & Visualization", type: "review", estimatedMinutes: 25, description: "Draw out tree operations and review tricky cases." },
          ]},
        ],
      },
      {
        title: "Graphs & Advanced Algorithms",
        goals: ["Master graph representations", "Implement BFS and DFS on graphs", "Solve topological sort problems"],
        days: [
          { label: "Monday", tasks: [
            { title: "Graph Representations (Adjacency List/Matrix)", type: "lesson", estimatedMinutes: 35, description: "Learn how to represent graphs and when to use each representation." },
            { title: "Graph Building Exercises", type: "practice", estimatedMinutes: 30, description: "Build graph representations from edge lists and adjacency data." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "DFS & BFS on Graphs", type: "lesson", estimatedMinutes: 40, description: "Master depth-first and breadth-first search with cycle detection." },
            { title: "Graph Search Problems", type: "practice", estimatedMinutes: 30, description: "Solve number of islands, connected components, and path finding." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Topological Sorting & DAGs", type: "lesson", estimatedMinutes: 35, description: "Learn topological sort using DFS and Kahn's algorithm." },
            { title: "Course Schedule & Task Ordering", type: "practice", estimatedMinutes: 30, description: "Solve course schedule and alien dictionary problems." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Shortest Path Algorithms", type: "lesson", estimatedMinutes: 40, description: "Learn Dijkstra's algorithm and BFS for unweighted graphs." },
            { title: "Network Delay & Path Problems", type: "practice", estimatedMinutes: 35, description: "Implement Dijkstra's and solve network delay time." },
          ]},
          { label: "Friday", tasks: [
            { title: "Week 5 Assessment", type: "quiz", estimatedMinutes: 25, description: "Comprehensive graph algorithms quiz." },
            { title: "DSA Review & Practice Plan", type: "review", estimatedMinutes: 30, description: "Review all DSA topics and plan continued practice." },
          ]},
        ],
      },
      {
        title: "Sorting & Final Review",
        goals: ["Implement all major sorting algorithms", "Know when to use each algorithm", "Solve综合 DSA problems"],
        days: [
          { label: "Monday", tasks: [
            { title: "Bubble, Selection & Insertion Sort", type: "lesson", estimatedMinutes: 35, description: "Learn O(n²) sorting algorithms and their trade-offs." },
            { title: "Implement Sorting from Scratch", type: "practice", estimatedMinutes: 30, description: "Code all three O(n²) sorts without looking at references." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Merge Sort & Quick Sort", type: "lesson", estimatedMinutes: 40, description: "Master divide-and-conquer sorting algorithms." },
            { title: "Quick Sort Partition Practice", type: "practice", estimatedMinutes: 30, description: "Implement quick sort with different pivot strategies." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Counting, Radix & Bucket Sort", type: "lesson", estimatedMinutes: 30, description: "Learn non-comparison based sorting algorithms." },
            { title: "Sorting Algorithm Comparison", type: "practice", estimatedMinutes: 30, description: "Benchmark and compare all sorting algorithms on different inputs." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Comprehensive DSA Problem Set", type: "project", estimatedMinutes: 45, description: "Solve 10 mixed DSA problems covering all topics." },
          ]},
          { label: "Friday", tasks: [
            { title: "Final Assessment", type: "quiz", estimatedMinutes: 30, description: "Final exam covering all DSA topics from the 6 weeks." },
            { title: "Course Wrap-up & Next Steps", type: "review", estimatedMinutes: 25, description: "Review your journey and identify areas for continued practice." },
          ]},
        ],
      },
    ],
  },
  {
    id: "web-dev-bootcamp",
    title: "Web Development Bootcamp",
    description: "Go from zero to building modern web apps with HTML, CSS, JavaScript & React.",
    durationWeeks: 8,
    difficulty: "beginner",
    category: "Web Development",
    icon: "🌐",
    weeks: [
      {
        title: "HTML Foundations",
        goals: ["Write semantic HTML", "Build accessible forms", "Understand document structure"],
        days: [
          { label: "Monday", tasks: [
            { title: "How the Web Works", type: "lesson", estimatedMinutes: 25, description: "Understand HTTP, browsers, servers, and DNS." },
            { title: "Your First HTML Page", type: "practice", estimatedMinutes: 30, description: "Create an HTML page with headings, paragraphs, and links." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Semantic HTML Elements", type: "lesson", estimatedMinutes: 30, description: "Learn header, nav, main, section, article, footer, and when to use them." },
            { title: "Blog Layout with Semantic HTML", type: "practice", estimatedMinutes: 35, description: "Build a blog page structure using semantic elements." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Images, Links & Media", type: "lesson", estimatedMinutes: 25, description: "Master img, video, audio, anchor tags, and relative vs absolute paths." },
            { title: "Media-Rich Page Project", type: "practice", estimatedMinutes: 30, description: "Create a portfolio page with images and external links." },
          ]},
          { label: "Thursday", tasks: [
            { title: "HTML Forms & Validation", type: "lesson", estimatedMinutes: 35, description: "Learn form elements, input types, validation attributes, and accessibility." },
            { title: "Registration Form", type: "project", estimatedMinutes: 40, description: "Build a complete registration form with client-side validation." },
          ]},
          { label: "Friday", tasks: [
            { title: "HTML Quiz", type: "quiz", estimatedMinutes: 20, description: "Test HTML knowledge and best practices." },
            { title: "Review & Accessibility Check", type: "review", estimatedMinutes: 25, description: "Review your forms and validate accessibility." },
          ]},
        ],
      },
      {
        title: "CSS Fundamentals",
        goals: ["Master CSS selectors and box model", "Build responsive layouts", "Use Flexbox and Grid"],
        days: [
          { label: "Monday", tasks: [
            { title: "CSS Selectors & Specificity", type: "lesson", estimatedMinutes: 30, description: "Learn all selector types and specificity rules." },
            { title: "Selector Practice", type: "practice", estimatedMinutes: 25, description: "Style a page using various selector types." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Box Model & Layout Basics", type: "lesson", estimatedMinutes: 30, description: "Understand margin, padding, border, and display properties." },
            { title: "Box Model Exercises", type: "practice", estimatedMinutes: 30, description: "Recreate layouts using proper box model techniques." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Flexbox Deep Dive", type: "lesson", estimatedMinutes: 35, description: "Master flex container and flex item properties." },
            { title: "Flexbox Layout Challenges", type: "practice", estimatedMinutes: 35, description: "Build navbar, sidebar, and card layouts with Flexbox." },
          ]},
          { label: "Thursday", tasks: [
            { title: "CSS Grid Layout", type: "lesson", estimatedMinutes: 35, description: "Learn grid-template, grid areas, and responsive grids." },
            { title: "Responsive Dashboard", type: "project", estimatedMinutes: 40, description: "Build a dashboard layout using CSS Grid." },
          ]},
          { label: "Friday", tasks: [
            { title: "CSS Quiz", type: "quiz", estimatedMinutes: 20, description: "Test CSS selectors, layout, and responsive design." },
            { title: "Style Audit", type: "review", estimatedMinutes: 25, description: "Review and improve your existing projects' CSS." },
          ]},
        ],
      },
      {
        title: "Advanced CSS & Responsive Design",
        goals: ["Use media queries effectively", "Implement animations", "Build mobile-first layouts"],
        days: [
          { label: "Monday", tasks: [
            { title: "Responsive Design & Media Queries", type: "lesson", estimatedMinutes: 30, description: "Learn mobile-first approach and responsive breakpoints." },
            { title: "Responsive Navigation Bar", type: "practice", estimatedMinutes: 35, description: "Build a hamburger menu navigation that works on all screens." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "CSS Transitions & Animations", type: "lesson", estimatedMinutes: 35, description: "Master transition, @keyframes, and animation properties." },
            { title: "Animated Landing Section", type: "practice", estimatedMinutes: 30, description: "Create an animated hero section with scroll effects." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "CSS Variables & Theming", type: "lesson", estimatedMinutes: 25, description: "Use CSS custom properties for dynamic theming." },
            { title: "Dark/Light Theme Toggle", type: "practice", estimatedMinutes: 30, description: "Build a theme toggle with CSS variables." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Modern CSS Techniques", type: "lesson", estimatedMinutes: 30, description: "Explore clamp(), container queries, and :has() selector." },
            { title: "Complete Landing Page", type: "project", estimatedMinutes: 45, description: "Build a full responsive landing page from a design." },
          ]},
          { label: "Friday", tasks: [
            { title: "Advanced CSS Quiz", type: "quiz", estimatedMinutes: 20, description: "Test responsive design and animation knowledge." },
            { title: "Portfolio Review", type: "review", estimatedMinutes: 25, description: "Review and polish your CSS projects." },
          ]},
        ],
      },
      {
        title: "JavaScript Essentials",
        goals: ["Master variables, functions, and DOM", "Handle events and async operations", "Build interactive pages"],
        days: [
          { label: "Monday", tasks: [
            { title: "JavaScript Basics & Variables", type: "lesson", estimatedMinutes: 30, description: "Learn let, const, var, and basic JS syntax in the browser." },
            { title: "Console Exercises", type: "practice", estimatedMinutes: 25, description: "Write JavaScript in the browser console to manipulate values." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "DOM Manipulation", type: "lesson", estimatedMinutes: 35, description: "Learn querySelector, createElement, appendChild, and textContent." },
            { title: "Dynamic List Builder", type: "practice", estimatedMinutes: 30, description: "Build a to-do list that adds/removes items dynamically." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Event Handling & Delegation", type: "lesson", estimatedMinutes: 30, description: "Master addEventListener, event bubbling, and delegation." },
            { title: "Interactive Form", type: "practice", estimatedMinutes: 35, description: "Build a multi-step form with event-driven validation." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Async JavaScript & Fetch API", type: "lesson", estimatedMinutes: 40, description: "Learn Promises, async/await, and the Fetch API." },
            { title: "Weather Dashboard", type: "project", estimatedMinutes: 40, description: "Build a weather app that fetches data from a public API." },
          ]},
          { label: "Friday", tasks: [
            { title: "JavaScript Quiz", type: "quiz", estimatedMinutes: 25, description: "Test JS fundamentals, DOM, and async knowledge." },
            { title: "Code Review", type: "review", estimatedMinutes: 25, description: "Review and refactor your JavaScript code." },
          ]},
        ],
      },
      {
        title: "Advanced JavaScript",
        goals: ["Understand closures and prototypal inheritance", "Master ES6+ features", "Write clean, modern JS"],
        days: [
          { label: "Monday", tasks: [
            { title: "Closures & Scope", type: "lesson", estimatedMinutes: 35, description: "Deep dive into closures, lexical scope, and practical uses." },
            { title: "Closure Practice Problems", type: "practice", estimatedMinutes: 30, description: "Solve 8 problems that leverage closures." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Prototypes & Classes", type: "lesson", estimatedMinutes: 35, description: "Learn prototypal inheritance, ES6 classes, and extends." },
            { title: "Class-based Components", type: "practice", estimatedMinutes: 30, description: "Build a class hierarchy for a game character system." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "ES6+ Features", type: "lesson", estimatedMinutes: 30, description: "Master spread, destructuring, modules, optional chaining, and more." },
            { title: "Modern JS Refactoring", type: "practice", estimatedMinutes: 30, description: "Refactor old JavaScript code to modern ES6+ syntax." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Error Handling & Debugging", type: "lesson", estimatedMinutes: 30, description: "Learn try/catch, error types, and browser dev tools debugging." },
            { title: "Robust API Client", type: "project", estimatedMinutes: 40, description: "Build an API client with retry logic, error handling, and caching." },
          ]},
          { label: "Friday", tasks: [
            { title: "Advanced JS Quiz", type: "quiz", estimatedMinutes: 25, description: "Test closures, prototypes, and ES6+ knowledge." },
            { title: "Review & Patterns", type: "review", estimatedMinutes: 25, description: "Review JS patterns and prepare for React." },
          ]},
        ],
      },
      {
        title: "React Fundamentals",
        goals: ["Understand component-based architecture", "Manage state with hooks", "Build your first React app"],
        days: [
          { label: "Monday", tasks: [
            { title: "What is React & JSX", type: "lesson", estimatedMinutes: 30, description: "Learn React's component model and JSX syntax." },
            { title: "Create React App / Vite Setup", type: "practice", estimatedMinutes: 25, description: "Set up a new React project and render your first component." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Components & Props", type: "lesson", estimatedMinutes: 35, description: "Master functional components, props, and prop drilling." },
            { title: "Props Practice — Card Components", type: "practice", estimatedMinutes: 30, description: "Build reusable card components with different prop configurations." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "useState & useEffect Hooks", type: "lesson", estimatedMinutes: 40, description: "Learn state management and side effects in functional components." },
            { title: "Interactive Counter App", type: "practice", estimatedMinutes: 30, description: "Build a counter with multiple state interactions." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Forms in React", type: "lesson", estimatedMinutes: 30, description: "Master controlled components and form state management." },
            { title: "Registration Form in React", type: "project", estimatedMinutes: 40, description: "Build a full registration form with validation." },
          ]},
          { label: "Friday", tasks: [
            { title: "React Fundamentals Quiz", type: "quiz", estimatedMinutes: 20, description: "Test React component and hooks knowledge." },
            { title: "Code Review & Refactor", type: "review", estimatedMinutes: 25, description: "Review and improve your React components." },
          ]},
        ],
      },
      {
        title: "React Advanced & Routing",
        goals: ["Master React Router", "Use useContext and useReducer", "Build multi-page applications"],
        days: [
          { label: "Monday", tasks: [
            { title: "React Router Setup", type: "lesson", estimatedMinutes: 30, description: "Learn routing with react-router-dom v6." },
            { title: "Multi-page App Setup", type: "practice", estimatedMinutes: 30, description: "Create a multi-page application with navigation." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "useContext & Global State", type: "lesson", estimatedMinutes: 35, description: "Master context API for managing global state." },
            { title: "Theme & Auth Context", type: "practice", estimatedMinutes: 30, description: "Implement theme switching and authentication context." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "useReducer & Complex State", type: "lesson", estimatedMinutes: 35, description: "Learn useReducer for complex state logic." },
            { title: "Shopping Cart with useReducer", type: "practice", estimatedMinutes: 35, description: "Build a shopping cart with add, remove, and update actions." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Data Fetching Patterns", type: "lesson", estimatedMinutes: 30, description: "Learn useSWR, useEffect for fetching, and loading states." },
            { title: "Blog App with API", type: "project", estimatedMinutes: 45, description: "Build a blog app that fetches and displays posts from an API." },
          ]},
          { label: "Friday", tasks: [
            { title: "Advanced React Quiz", type: "quiz", estimatedMinutes: 20, description: "Test routing, context, and reducer knowledge." },
            { title: "Review & Best Practices", type: "review", estimatedMinutes: 25, description: "Review React best patterns and prepare for the capstone." },
          ]},
        ],
      },
      {
        title: "Capstone Project",
        goals: ["Apply all learned skills", "Build a portfolio-worthy project", "Deploy your application"],
        days: [
          { label: "Monday", tasks: [
            { title: "Project Planning & Wireframing", type: "lesson", estimatedMinutes: 30, description: "Plan your capstone project — define features, sketch wireframes." },
            { title: "Project Setup & Architecture", type: "project", estimatedMinutes: 40, description: "Set up React project with routing, folder structure, and components." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Build Core UI Components", type: "project", estimatedMinutes: 45, description: "Implement the main layout, navigation, and page components." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "State Management & API Integration", type: "project", estimatedMinutes: 45, description: "Connect your app to APIs and manage application state." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Styling, Polish & Responsive Design", type: "project", estimatedMinutes: 45, description: "Add responsive design, animations, and visual polish." },
          ]},
          { label: "Friday", tasks: [
            { title: "Testing & Deployment", type: "project", estimatedMinutes: 40, description: "Test your app and deploy to Vercel or Netlify." },
            { title: "Course Wrap-up & Career Next Steps", type: "review", estimatedMinutes: 25, description: "Review what you've learned and plan your web dev career path." },
          ]},
        ],
      },
    ],
  },
  {
    id: "ml-foundations",
    title: "Machine Learning Foundations",
    description: "Learn ML from math basics to building and evaluating your first models.",
    durationWeeks: 6,
    difficulty: "intermediate",
    category: "Data Science",
    icon: "🤖",
    weeks: [
      {
        title: "Math Refresher for ML",
        goals: ["Review linear algebra essentials", "Understand probability & statistics", "Master calculus for gradients"],
        days: [
          { label: "Monday", tasks: [
            { title: "Linear Algebra: Vectors & Matrices", type: "lesson", estimatedMinutes: 40, description: "Review vector operations, matrix multiplication, and transposition." },
            { title: "Linear Algebra Exercises", type: "practice", estimatedMinutes: 25, description: "Solve matrix operations and vector problems by hand." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Probability & Distributions", type: "lesson", estimatedMinutes: 35, description: "Learn probability rules, Bayes' theorem, and common distributions." },
            { title: "Probability Problem Set", type: "practice", estimatedMinutes: 30, description: "Solve conditional probability and distribution problems." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Statistics: Mean, Variance & Distributions", type: "lesson", estimatedMinutes: 30, description: "Review descriptive statistics, hypothesis testing, and p-values." },
            { title: "Statistical Analysis Practice", type: "practice", estimatedMinutes: 30, description: "Perform statistical analysis on sample datasets." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Calculus for Gradients", type: "lesson", estimatedMinutes: 35, description: "Understand derivatives, partial derivatives, and gradient vectors." },
            { title: "Gradient Calculation Exercises", type: "practice", estimatedMinutes: 25, description: "Compute gradients for various functions." },
          ]},
          { label: "Friday", tasks: [
            { title: "Math Foundations Quiz", type: "quiz", estimatedMinutes: 25, description: "Test linear algebra, probability, and calculus knowledge." },
            { title: "Review & Gaps Identification", type: "review", estimatedMinutes: 25, description: "Review weak areas and create a study plan for gaps." },
          ]},
        ],
      },
      {
        title: "Python for Data Science",
        goals: ["Master NumPy and Pandas", "Perform data cleaning", "Visualize data with Matplotlib"],
        days: [
          { label: "Monday", tasks: [
            { title: "NumPy Arrays & Operations", type: "lesson", estimatedMinutes: 35, description: "Learn NumPy array creation, slicing, broadcasting, and linear algebra ops." },
            { title: "NumPy Challenge Problems", type: "practice", estimatedMinutes: 30, description: "Solve 10 problems using NumPy vectorized operations." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Pandas DataFrames", type: "lesson", estimatedMinutes: 40, description: "Master DataFrame creation, selection, filtering, and groupby." },
            { title: "Pandas Data Wrangling", type: "practice", estimatedMinutes: 30, description: "Clean and transform a messy real-world dataset." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Data Cleaning Techniques", type: "lesson", estimatedMinutes: 30, description: "Handle missing values, outliers, and data type conversions." },
            { title: "Cleaning Challenge Dataset", type: "practice", estimatedMinutes: 35, description: "Clean a dataset with 20+ issues." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Data Visualization with Matplotlib & Seaborn", type: "lesson", estimatedMinutes: 35, description: "Create line plots, bar charts, scatter plots, heatmaps, and more." },
            { title: "Exploratory Data Analysis Project", type: "project", estimatedMinutes: 40, description: "Perform EDA on a Kaggle dataset with visualizations." },
          ]},
          { label: "Friday", tasks: [
            { title: "Data Science Tools Quiz", type: "quiz", estimatedMinutes: 20, description: "Test NumPy, Pandas, and visualization knowledge." },
            { title: "Review & Tool Selection", type: "review", estimatedMinutes: 25, description: "Review tools and prepare for ML modeling." },
          ]},
        ],
      },
      {
        title: "Supervised Learning: Regression",
        goals: ["Understand linear regression deeply", "Implement gradient descent", "Evaluate regression models"],
        days: [
          { label: "Monday", tasks: [
            { title: "Linear Regression Theory", type: "lesson", estimatedMinutes: 35, description: "Learn the cost function, normal equation, and assumptions." },
            { title: "Simple Linear Regression from Scratch", type: "practice", estimatedMinutes: 35, description: "Implement simple linear regression using NumPy." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Gradient Descent Optimization", type: "lesson", estimatedMinutes: 40, description: "Master batch, stochastic, and mini-batch gradient descent." },
            { title: "Gradient Descent Implementation", type: "practice", estimatedMinutes: 30, description: "Implement gradient descent with learning rate scheduling." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Multiple Regression & Feature Engineering", type: "lesson", estimatedMinutes: 35, description: "Extend to multiple features and learn feature scaling techniques." },
            { title: "Feature Engineering Practice", type: "practice", estimatedMinutes: 30, description: "Engineer features for a housing price prediction dataset." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Model Evaluation Metrics", type: "lesson", estimatedMinutes: 30, description: "Learn MSE, RMSE, MAE, R², and cross-validation." },
            { title: "Regression Model Pipeline", type: "project", estimatedMinutes: 45, description: "Build a complete regression pipeline with scikit-learn." },
          ]},
          { label: "Friday", tasks: [
            { title: "Regression Quiz", type: "quiz", estimatedMinutes: 20, description: "Test regression and gradient descent knowledge." },
            { title: "Model Comparison Review", type: "review", estimatedMinutes: 25, description: "Compare your from-scratch model with scikit-learn." },
          ]},
        ],
      },
      {
        title: "Supervised Learning: Classification",
        goals: ["Understand logistic regression", "Master decision trees and SVMs", "Handle imbalanced data"],
        days: [
          { label: "Monday", tasks: [
            { title: "Logistic Regression", type: "lesson", estimatedMinutes: 35, description: "Learn sigmoid function, decision boundary, and cost function." },
            { title: "Logistic Regression from Scratch", type: "practice", estimatedMinutes: 35, description: "Implement logistic regression for binary classification." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Decision Trees & Random Forests", type: "lesson", estimatedMinutes: 40, description: "Understand tree-based models, Gini impurity, and ensemble methods." },
            { title: "Tree Model Practice", type: "practice", estimatedMinutes: 30, description: "Train and tune decision trees and random forests." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Support Vector Machines", type: "lesson", estimatedMinutes: 35, description: "Learn SVM concepts, kernels, and margin maximization." },
            { title: "SVM Classification Exercise", type: "practice", estimatedMinutes: 30, description: "Apply SVMs with different kernels on toy datasets." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Imbalanced Data & Evaluation", type: "lesson", estimatedMinutes: 30, description: "Learn precision, recall, F1, ROC-AUC, and handling imbalanced classes." },
            { title: "Classification Project", type: "project", estimatedMinutes: 45, description: "Build a spam classifier with multiple models and evaluation." },
          ]},
          { label: "Friday", tasks: [
            { title: "Classification Quiz", type: "quiz", estimatedMinutes: 25, description: "Test classification algorithms and evaluation metrics." },
            { title: "Algorithm Selection Guide", type: "review", estimatedMinutes: 25, description: "Create a decision guide for choosing classification algorithms." },
          ]},
        ],
      },
      {
        title: "Unsupervised Learning & Dimensionality Reduction",
        goals: ["Master K-Means clustering", "Understand PCA for dimensionality reduction", "Apply clustering to real data"],
        days: [
          { label: "Monday", tasks: [
            { title: "K-Means Clustering", type: "lesson", estimatedMinutes: 35, description: "Learn the K-Means algorithm, initialization, and convergence." },
            { title: "K-Means Implementation", type: "practice", estimatedMinutes: 30, description: "Implement K-Means from scratch and compare with scikit-learn." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Choosing K: Elbow & Silhouette Methods", type: "lesson", estimatedMinutes: 30, description: "Learn techniques for selecting optimal number of clusters." },
            { title: "Cluster Analysis Practice", type: "practice", estimatedMinutes: 30, description: "Apply clustering to customer segmentation data." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "PCA & Dimensionality Reduction", type: "lesson", estimatedMinutes: 40, description: "Master Principal Component Analysis and explained variance." },
            { title: "PCA for Visualization", type: "practice", estimatedMinutes: 30, description: "Reduce high-dimensional data and visualize in 2D." },
          ]},
          { label: "Thursday", tasks: [
            { title: "DBSCAN & Other Clustering Methods", type: "lesson", estimatedMinutes: 30, description: "Learn density-based clustering and hierarchical methods." },
            { title: "Customer Segmentation Project", type: "project", estimatedMinutes: 45, description: "Segment customers using clustering and PCA." },
          ]},
          { label: "Friday", tasks: [
            { title: "Unsupervised Learning Quiz", type: "quiz", estimatedMinutes: 20, description: "Test clustering and dimensionality reduction concepts." },
            { title: "Review & ML Roadmap", type: "review", estimatedMinutes: 25, description: "Review all ML topics and plan your next learning steps." },
          ]},
        ],
      },
      {
        title: "ML Engineering & Deployment",
        goals: ["Build end-to-end ML pipelines", "Tune hyperparameters systematically", "Deploy a model to production"],
        days: [
          { label: "Monday", tasks: [
            { title: "Feature Pipelines & Data Versioning", type: "lesson", estimatedMinutes: 30, description: "Learn reproducible feature engineering and data management." },
            { title: "Pipeline Setup Practice", type: "practice", estimatedMinutes: 30, description: "Build a reusable feature engineering pipeline." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Hyperparameter Tuning", type: "lesson", estimatedMinutes: 35, description: "Master grid search, random search, and Bayesian optimization." },
            { title: "Hyperparameter Optimization", type: "practice", estimatedMinutes: 35, description: "Tune a random forest model using Optuna." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Model Serialization & Serving", type: "lesson", estimatedMinutes: 30, description: "Learn joblib, pickle, ONNX, and building prediction APIs." },
            { title: "Flask API for ML Model", type: "practice", estimatedMinutes: 35, description: "Build a REST API that serves model predictions." },
          ]},
          { label: "Thursday", tasks: [
            { title: "ML Model Deployment", type: "lesson", estimatedMinutes: 30, description: "Deploy to cloud platforms with Docker containers." },
            { title: "End-to-End ML Project", type: "project", estimatedMinutes: 45, description: "Build, evaluate, and deploy a complete ML solution." },
          ]},
          { label: "Friday", tasks: [
            { title: "Final Assessment", type: "quiz", estimatedMinutes: 25, description: "Comprehensive assessment covering all ML foundations." },
            { title: "Course Wrap-up & ML Career Path", type: "review", estimatedMinutes: 25, description: "Review your journey and explore ML career opportunities." },
          ]},
        ],
      },
    ],
  },
  {
    id: "system-design",
    title: "System Design Interview Prep",
    description: "Ace system design interviews with scalability patterns and architecture fundamentals.",
    durationWeeks: 4,
    difficulty: "advanced",
    category: "Interview Prep",
    icon: "🏗️",
    weeks: [
      {
        title: "Fundamentals of System Design",
        goals: ["Understand scalability concepts", "Master load balancing strategies", "Learn caching patterns"],
        days: [
          { label: "Monday", tasks: [
            { title: "System Design Interview Framework", type: "lesson", estimatedMinutes: 35, description: "Learn the 4-step framework: requirements, design, deep-dive, bottlenecks." },
            { title: "Practice: Define Requirements", type: "practice", estimatedMinutes: 25, description: "Practice gathering functional and non-functional requirements." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Scalability: Horizontal vs Vertical", type: "lesson", estimatedMinutes: 30, description: "Understand scaling strategies and when to use each." },
            { title: "Load Balancing Strategies", type: "lesson", estimatedMinutes: 30, description: "Learn round-robin, least connections, IP hash, and more." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Caching Strategies", type: "lesson", estimatedMinutes: 35, description: "Master write-through, write-back, cache-aside, and CDN caching." },
            { title: "Caching Design Exercise", type: "practice", estimatedMinutes: 30, description: "Design a caching layer for a high-traffic application." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Database Selection & Sharding", type: "lesson", estimatedMinutes: 40, description: "Learn SQL vs NoSQL trade-offs, sharding, and replication." },
            { title: "Database Design Problem", type: "practice", estimatedMinutes: 30, description: "Design a database schema for a social media platform." },
          ]},
          { label: "Friday", tasks: [
            { title: "Fundamentals Quiz", type: "quiz", estimatedMinutes: 25, description: "Test system design fundamentals." },
            { title: "Review & Notes", type: "review", estimatedMinutes: 25, description: "Review and create your system design cheat sheet." },
          ]},
        ],
      },
      {
        title: "Communication & Data Patterns",
        goals: ["Master API design", "Understand message queues", "Design real-time systems"],
        days: [
          { label: "Monday", tasks: [
            { title: "RESTful API Design", type: "lesson", estimatedMinutes: 30, description: "Learn REST principles, versioning, pagination, and error handling." },
            { title: "API Design Practice", type: "practice", estimatedMinutes: 30, description: "Design APIs for a ride-sharing application." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Message Queues & Pub/Sub", type: "lesson", estimatedMinutes: 35, description: "Understand Kafka, RabbitMQ, and event-driven architecture." },
            { title: "Message Queue Design Exercise", type: "practice", estimatedMinutes: 30, description: "Design an order processing system with message queues." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "WebSockets & Real-time Systems", type: "lesson", estimatedMinutes: 35, description: "Learn WebSocket architecture for chat and live updates." },
            { title: "Chat System Design", type: "practice", estimatedMinutes: 35, description: "Design a real-time chat application like WhatsApp." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Content Delivery Networks", type: "lesson", estimatedMinutes: 25, description: "Understand CDN architecture, caching at the edge, and geo-routing." },
            { title: "URL Shortener Design", type: "project", estimatedMinutes: 40, description: "Design a URL shortener like bit.ly with analytics." },
          ]},
          { label: "Friday", tasks: [
            { title: "Communication Patterns Quiz", type: "quiz", estimatedMinutes: 20, description: "Test API, messaging, and real-time design knowledge." },
            { title: "Pattern Review", type: "review", estimatedMinutes: 25, description: "Review communication patterns and trade-offs." },
          ]},
        ],
      },
      {
        title: "Classic System Design Problems",
        goals: ["Design YouTube, Twitter, and Netflix", "Apply all learned patterns", "Practice under time pressure"],
        days: [
          { label: "Monday", tasks: [
            { title: "Design YouTube/Video Streaming", type: "lesson", estimatedMinutes: 40, description: "Full walkthrough: video upload, processing, CDN delivery, recommendations." },
            { title: "YouTube Design Practice", type: "practice", estimatedMinutes: 30, description: "Practice explaining the YouTube design within 30 minutes." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Design Twitter/News Feed", type: "lesson", estimatedMinutes: 40, description: "Fan-out on write vs read, timeline generation, and trending topics." },
            { title: "Twitter Design Practice", type: "practice", estimatedMinutes: 30, description: "Practice explaining Twitter's news feed system design." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Design Netflix/Streaming Service", type: "lesson", estimatedMinutes: 40, description: "Content recommendation, adaptive bitrate streaming, and global distribution." },
            { title: "Netflix Design Practice", type: "practice", estimatedMinutes: 30, description: "Design Netflix's recommendation and streaming architecture." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Design Uber/Location Service", type: "lesson", estimatedMinutes: 40, description: "Geospatial indexing, matching, and real-time location tracking." },
            { title: "Mock Interview: Uber", type: "project", estimatedMinutes: 45, description: "Simulate a full 45-minute system design interview for Uber." },
          ]},
          { label: "Friday", tasks: [
            { title: "Classic Systems Quiz", type: "quiz", estimatedMinutes: 25, description: "Test knowledge of classic system designs." },
            { title: "Review & Trade-off Analysis", type: "review", estimatedMinutes: 25, description: "Review trade-offs across all systems studied." },
          ]},
        ],
      },
      {
        title: "Advanced Topics & Interview Strategy",
        goals: ["Handle follow-up questions confidently", "Discuss reliability and monitoring", "Practice full mock interviews"],
        days: [
          { label: "Monday", tasks: [
            { title: "Reliability, Availability & Consistency", type: "lesson", estimatedMinutes: 35, description: "Master CAP theorem, replication, and consistency models." },
            { title: "Consistency Trade-off Exercise", type: "practice", estimatedMinutes: 25, description: "Analyze consistency trade-offs for various systems." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Monitoring, Logging & Alerting", type: "lesson", estimatedMinutes: 30, description: "Learn observability pillars and operational best practices." },
            { title: "Monitoring Design Exercise", type: "practice", estimatedMinutes: 25, description: "Design a monitoring system for a microservices architecture." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Security in System Design", type: "lesson", estimatedMinutes: 30, description: "Cover authentication, rate limiting, DDoS protection, and data encryption." },
            { title: "Security Design Exercise", type: "practice", estimatedMinutes: 25, description: "Add security considerations to a system design." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Mock Interview #1", type: "project", estimatedMinutes: 45, description: "Complete a timed mock system design interview." },
          ]},
          { label: "Friday", tasks: [
            { title: "Final Mock Interview & Review", type: "project", estimatedMinutes: 45, description: "Complete your final mock interview with a new problem." },
            { title: "Course Review & Interview Tips", type: "review", estimatedMinutes: 25, description: "Review all concepts and get final interview tips." },
          ]},
        ],
      },
    ],
  },
  {
    id: "english-writing",
    title: "English Writing Mastery",
    description: "Improve your English writing from grammar fundamentals to compelling essays.",
    durationWeeks: 4,
    difficulty: "intermediate",
    category: "Language",
    icon: "✍️",
    weeks: [
      {
        title: "Grammar & Sentence Structure",
        goals: ["Master parts of speech", "Write complex sentences", "Eliminate common grammar errors"],
        days: [
          { label: "Monday", tasks: [
            { title: "Parts of Speech Review", type: "lesson", estimatedMinutes: 25, description: "Review nouns, verbs, adjectives, adverbs, prepositions, and conjunctions." },
            { title: "Parts of Speech Identification", type: "practice", estimatedMinutes: 20, description: "Identify parts of speech in 20 complex sentences." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Sentence Types & Structures", type: "lesson", estimatedMinutes: 30, description: "Master simple, compound, complex, and compound-complex sentences." },
            { title: "Sentence Combining Exercises", type: "practice", estimatedMinutes: 25, description: "Combine short sentences into varied complex structures." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Common Grammar Errors", type: "lesson", estimatedMinutes: 30, description: "Fix subject-verb agreement, pronoun reference, and tense consistency." },
            { title: "Error Correction Practice", type: "practice", estimatedMinutes: 25, description: "Find and fix 20 grammar errors in passages." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Parallel Structure & Conciseness", type: "lesson", estimatedMinutes: 25, description: "Write parallel lists and eliminate wordiness." },
            { title: "Editing Workshop", type: "practice", estimatedMinutes: 30, description: "Edit verbose paragraphs into concise, clear prose." },
          ]},
          { label: "Friday", tasks: [
            { title: "Grammar Quiz", type: "quiz", estimatedMinutes: 20, description: "Test grammar and sentence structure knowledge." },
            { title: "Self-Review Writing Sample", type: "review", estimatedMinutes: 25, description: "Write a paragraph and self-edit using learned techniques." },
          ]},
        ],
      },
      {
        title: "Paragraph & Essay Structure",
        goals: ["Write well-organized paragraphs", "Master essay structure", "Develop thesis statements"],
        days: [
          { label: "Monday", tasks: [
            { title: "Paragraph Unity & Coherence", type: "lesson", estimatedMinutes: 30, description: "Learn topic sentences, supporting details, and transitions." },
            { title: "Paragraph Writing Practice", type: "practice", estimatedMinutes: 25, description: "Write 5 paragraphs on different topics using proper structure." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Transition Words & Phrases", type: "lesson", estimatedMinutes: 25, description: "Master transitions for addition, contrast, cause/effect, and sequence." },
            { title: "Transition Practice", type: "practice", estimatedMinutes: 25, description: "Add appropriate transitions to disconnected paragraphs." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Essay Types & Thesis Statements", type: "lesson", estimatedMinutes: 35, description: "Learn argumentative, expository, and narrative essay structures." },
            { title: "Thesis Statement Workshop", type: "practice", estimatedMinutes: 25, description: "Write 10 thesis statements for different topics." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Essay Outline & Drafting", type: "lesson", estimatedMinutes: 30, description: "Create outlines and write first drafts efficiently." },
            { title: "Argumentative Essay Draft", type: "project", estimatedMinutes: 40, description: "Write a complete argumentative essay with introduction, body, and conclusion." },
          ]},
          { label: "Friday", tasks: [
            { title: "Structure Quiz", type: "quiz", estimatedMinutes: 20, description: "Test paragraph and essay structure knowledge." },
            { title: "Peer Review Simulation", type: "review", estimatedMinutes: 25, description: "Review your essay with a critical eye and revise." },
          ]},
        ],
      },
      {
        title: "Advanced Writing & Style",
        goals: ["Develop your writing voice", "Use rhetorical devices effectively", "Write persuasively"],
        days: [
          { label: "Monday", tasks: [
            { title: "Active vs Passive Voice", type: "lesson", estimatedMinutes: 25, description: "Master when to use active and passive voice for impact." },
            { title: "Voice Conversion Exercises", type: "practice", estimatedMinutes: 25, description: "Convert 15 passive sentences to active voice and vice versa." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Rhetorical Devices", type: "lesson", estimatedMinutes: 30, description: "Learn metaphor, simile, anaphora, tricolon, and rhetorical questions." },
            { title: "Rhetorical Device Practice", type: "practice", estimatedMinutes: 25, description: "Incorporate 5 rhetorical devices into a persuasive paragraph." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Tone, Register & Audience", type: "lesson", estimatedMinutes: 30, description: "Adjust writing tone for academic, professional, and casual contexts." },
            { title: "Tone Adaptation Exercise", type: "practice", estimatedMinutes: 25, description: "Rewrite the same message for 3 different audiences." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Persuasive Writing Techniques", type: "lesson", estimatedMinutes: 30, description: "Master ethos, pathos, logos, and the art of persuasion." },
            { title: "Persuasive Essay Project", type: "project", estimatedMinutes: 40, description: "Write a compelling persuasive essay on a topic of your choice." },
          ]},
          { label: "Friday", tasks: [
            { title: "Style Quiz", type: "quiz", estimatedMinutes: 20, description: "Test advanced writing concepts." },
            { title: "Style Imitation Exercise", type: "review", estimatedMinutes: 25, description: "Imitate the style of a famous writer and compare." },
          ]},
        ],
      },
      {
        title: "Professional & Creative Writing",
        goals: ["Write professional emails and reports", "Explore creative writing forms", "Polish your final portfolio"],
        days: [
          { label: "Monday", tasks: [
            { title: "Professional Email Writing", type: "lesson", estimatedMinutes: 25, description: "Master email etiquette, structure, and tone for business." },
            { title: "Email Scenarios Practice", type: "practice", estimatedMinutes: 25, description: "Write 5 professional emails for different scenarios." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Report & Proposal Writing", type: "lesson", estimatedMinutes: 30, description: "Learn structured business report and proposal formats." },
            { title: "Brief Report Draft", type: "practice", estimatedMinutes: 30, description: "Write a 1-page business report with data and recommendations." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Creative Writing: Short Fiction", type: "lesson", estimatedMinutes: 30, description: "Learn narrative techniques: show don't tell, dialogue, and pacing." },
            { title: "Flash Fiction Writing", type: "practice", estimatedMinutes: 35, description: "Write a 500-word flash fiction piece using taught techniques." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Proofreading & Final Polish", type: "lesson", estimatedMinutes: 25, description: "Master proofreading techniques and common typos to watch for." },
            { title: "Writing Portfolio Compilation", type: "project", estimatedMinutes: 40, description: "Compile your best work from the course into a polished portfolio." },
          ]},
          { label: "Friday", tasks: [
            { title: "Final Assessment", type: "quiz", estimatedMinutes: 25, description: "Comprehensive writing assessment across all topics." },
            { title: "Course Review & Writing Goals", type: "review", estimatedMinutes: 25, description: "Review your progress and set ongoing writing goals." },
          ]},
        ],
      },
    ],
  },
  {
    id: "math-for-cs",
    title: "Mathematics for Computer Science",
    description: "Build mathematical maturity with discrete math, probability, and number theory.",
    durationWeeks: 6,
    difficulty: "intermediate",
    category: "Computer Science",
    icon: "🔢",
    weeks: [
      {
        title: "Logic & Proofs",
        goals: ["Understand propositional logic", "Write mathematical proofs", "Master proof techniques"],
        days: [
          { label: "Monday", tasks: [
            { title: "Propositional Logic", type: "lesson", estimatedMinutes: 35, description: "Learn logical operators, truth tables, and logical equivalences." },
            { title: "Truth Table Exercises", type: "practice", estimatedMinutes: 25, description: "Construct truth tables for 10 complex logical expressions." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Predicate Logic & Quantifiers", type: "lesson", estimatedMinutes: 35, description: "Master universal and existential quantifiers and nested quantifiers." },
            { title: "Quantifier Translation Practice", type: "practice", estimatedMinutes: 25, description: "Translate English statements to predicate logic and vice versa." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Proof Techniques: Direct & Contrapositive", type: "lesson", estimatedMinutes: 35, description: "Learn direct proof and proof by contrapositive with examples." },
            { title: "Direct Proof Practice", type: "practice", estimatedMinutes: 30, description: "Write 5 direct proofs for number theory statements." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Proof by Contradiction & Induction", type: "lesson", estimatedMinutes: 40, description: "Master proof by contradiction and mathematical induction." },
            { title: "Induction Exercises", type: "practice", estimatedMinutes: 30, description: "Prove 5 statements using mathematical induction." },
          ]},
          { label: "Friday", tasks: [
            { title: "Logic & Proofs Quiz", type: "quiz", estimatedMinutes: 25, description: "Test logic and proof technique knowledge." },
            { title: "Proof Portfolio Review", type: "review", estimatedMinutes: 25, description: "Review your proofs and refine your technique." },
          ]},
        ],
      },
      {
        title: "Sets, Relations & Functions",
        goals: ["Master set operations", "Understand relations and equivalence classes", "Classify functions"],
        days: [
          { label: "Monday", tasks: [
            { title: "Set Theory Fundamentals", type: "lesson", estimatedMinutes: 30, description: "Learn set notation, union, intersection, complement, and power sets." },
            { title: "Set Operations Practice", type: "practice", estimatedMinutes: 25, description: "Solve set theory problems involving Venn diagrams." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Relations & Their Properties", type: "lesson", estimatedMinutes: 35, description: "Master reflexive, symmetric, transitive, and antisymmetric relations." },
            { title: "Relation Analysis Exercises", type: "practice", estimatedMinutes: 25, description: "Classify relations by their properties." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Equivalence Relations & Partitions", type: "lesson", estimatedMinutes: 30, description: "Understand equivalence classes and their connection to partitions." },
            { title: "Equivalence Class Problems", type: "practice", estimatedMinutes: 25, description: "Find equivalence classes for various relations." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Functions: Injection, Surjection, Bijection", type: "lesson", estimatedMinutes: 30, description: "Classify functions and understand their properties." },
            { title: "Function Classification Practice", type: "practice", estimatedMinutes: 25, description: "Classify 15 functions as injective, surjective, or bijective." },
          ]},
          { label: "Friday", tasks: [
            { title: "Sets & Functions Quiz", type: "quiz", estimatedMinutes: 20, description: "Test sets, relations, and functions knowledge." },
            { title: "Concept Mapping", type: "review", estimatedMinutes: 25, description: "Create a concept map connecting all set theory topics." },
          ]},
        ],
      },
      {
        title: "Combinatorics & Counting",
        goals: ["Master permutations and combinations", "Apply pigeonhole principle", "Solve counting problems"],
        days: [
          { label: "Monday", tasks: [
            { title: "Basic Counting Principles", type: "lesson", estimatedMinutes: 30, description: "Learn multiplication rule, addition rule, and complement counting." },
            { title: "Basic Counting Exercises", type: "practice", estimatedMinutes: 25, description: "Solve 10 counting problems using fundamental principles." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Permutations & Combinations", type: "lesson", estimatedMinutes: 35, description: "Master P(n,r), C(n,r), and when to use each." },
            { title: "Permutation & Combination Problems", type: "practice", estimatedMinutes: 30, description: "Solve selection and arrangement problems." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Pigeonhole Principle", type: "lesson", estimatedMinutes: 25, description: "Learn the pigeonhole principle and its applications." },
            { title: "Pigeonhole Problems", type: "practice", estimatedMinutes: 25, description: "Solve 8 problems using the pigeonhole principle." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Binomial Theorem & Pascal's Triangle", type: "lesson", estimatedMinutes: 35, description: "Master binomial expansion and properties of Pascal's triangle." },
            { title: "Binomial Coefficient Problems", type: "practice", estimatedMinutes: 30, description: "Solve problems involving binomial coefficients and identities." },
          ]},
          { label: "Friday", tasks: [
            { title: "Combinatorics Quiz", type: "quiz", estimatedMinutes: 20, description: "Test counting and combinatorics knowledge." },
            { title: "Review & Pattern Recognition", type: "review", estimatedMinutes: 25, description: "Review counting patterns and problem-solving strategies." },
          ]},
        ],
      },
      {
        title: "Graph Theory",
        goals: ["Understand graph terminology", "Apply graph algorithms", "Solve graph coloring problems"],
        days: [
          { label: "Monday", tasks: [
            { title: "Graph Fundamentals", type: "lesson", estimatedMinutes: 35, description: "Learn directed, undirected, weighted graphs, and their representations." },
            { title: "Graph Construction Exercises", type: "practice", estimatedMinutes: 25, description: "Construct graphs from adjacency matrices and edge lists." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Paths, Cycles & Connectivity", type: "lesson", estimatedMinutes: 30, description: "Understand Euler and Hamiltonian paths, connected components." },
            { title: "Path & Cycle Problems", type: "practice", estimatedMinutes: 30, description: "Determine path existence and find Hamiltonian paths." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Trees & Spanning Trees", type: "lesson", estimatedMinutes: 35, description: "Learn tree properties, minimum spanning trees, and Prim's/Kruskal's algorithms." },
            { title: "MST Construction Practice", type: "practice", estimatedMinutes: 30, description: "Find minimum spanning trees using Prim's and Kruskal's." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Graph Coloring & Planarity", type: "lesson", estimatedMinutes: 35, description: "Master vertex coloring, chromatic number, and planar graphs." },
            { title: "Graph Coloring Problems", type: "practice", estimatedMinutes: 30, description: "Color graphs and determine chromatic numbers." },
          ]},
          { label: "Friday", tasks: [
            { title: "Graph Theory Quiz", type: "quiz", estimatedMinutes: 25, description: "Test graph theory fundamentals." },
            { title: "Graph Theory Review", type: "review", estimatedMinutes: 25, description: "Review graph concepts and applications in CS." },
          ]},
        ],
      },
      {
        title: "Number Theory & Algebra",
        goals: ["Master modular arithmetic", "Understand prime numbers", "Apply number theory in CS"],
        days: [
          { label: "Monday", tasks: [
            { title: "Divisibility & Primes", type: "lesson", estimatedMinutes: 30, description: "Learn divisibility rules, prime factorization, and the fundamental theorem." },
            { title: "Prime Number Exercises", type: "practice", estimatedMinutes: 25, description: "Find prime factorizations and apply divisibility tests." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Modular Arithmetic", type: "lesson", estimatedMinutes: 35, description: "Master congruences, modular operations, and Fermat's little theorem." },
            { title: "Modular Arithmetic Problems", type: "practice", estimatedMinutes: 30, description: "Solve congruence equations and modular puzzles." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "GCD, Euclidean Algorithm & Bezout's Identity", type: "lesson", estimatedMinutes: 35, description: "Learn GCD computation and its applications." },
            { title: "Euclidean Algorithm Practice", type: "practice", estimatedMinutes: 25, description: "Compute GCDs and find Bezout coefficients." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Applications: RSA & Hashing", type: "lesson", estimatedMinutes: 35, description: "See how number theory powers cryptography and hashing." },
            { title: "Number Theory Project", type: "project", estimatedMinutes: 40, description: "Implement a simple RSA encryption/decryption system." },
          ]},
          { label: "Friday", tasks: [
            { title: "Number Theory Quiz", type: "quiz", estimatedMinutes: 25, description: "Test modular arithmetic and number theory." },
            { title: "Course Review & Connections", type: "review", estimatedMinutes: 25, description: "Review how all topics connect to computer science applications." },
          ]},
        ],
      },
      {
        title: "Probability & Final Review",
        goals: ["Master probability distributions", "Apply Bayes' theorem", "Integrate all topics"],
        days: [
          { label: "Monday", tasks: [
            { title: "Probability Fundamentals", type: "lesson", estimatedMinutes: 35, description: "Review sample spaces, events, conditional probability, and independence." },
            { title: "Probability Exercises", type: "practice", estimatedMinutes: 25, description: "Solve 10 probability problems using fundamental rules." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Bayes' Theorem & Applications", type: "lesson", estimatedMinutes: 35, description: "Master Bayes' theorem and its applications in CS." },
            { title: "Bayes' Theorem Problems", type: "practice", estimatedMinutes: 30, description: "Solve medical testing, spam filtering, and other Bayes problems." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Random Variables & Distributions", type: "lesson", estimatedMinutes: 40, description: "Learn expected value, variance, and common distributions." },
            { title: "Distribution Exercises", type: "practice", estimatedMinutes: 30, description: "Calculate expected values and variances for various distributions." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Comprehensive Review Problem Set", type: "project", estimatedMinutes: 45, description: "Solve 15 problems spanning all course topics." },
          ]},
          { label: "Friday", tasks: [
            { title: "Final Assessment", type: "quiz", estimatedMinutes: 30, description: "Comprehensive final exam covering all 6 weeks." },
            { title: "Course Wrap-up & Resources", type: "review", estimatedMinutes: 25, description: "Review your journey and get resources for continued learning." },
          ]},
        ],
      },
    ],
  },
  {
    id: "cloud-aws",
    title: "Cloud Computing (AWS)",
    description: "Learn core AWS services — EC2, S3, RDS, Lambda, and deploy real applications.",
    durationWeeks: 5,
    difficulty: "intermediate",
    category: "Cloud & DevOps",
    icon: "☁️",
    weeks: [
      {
        title: "AWS Fundamentals & IAM",
        goals: ["Set up an AWS account", "Understand IAM policies", "Navigate the AWS console"],
        days: [
          { label: "Monday", tasks: [
            { title: "Introduction to Cloud Computing", type: "lesson", estimatedMinutes: 25, description: "Learn IaaS, PaaS, SaaS, and cloud computing benefits." },
            { title: "AWS Account Setup", type: "practice", estimatedMinutes: 30, description: "Create an AWS account and configure billing alerts." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "IAM Users, Groups & Roles", type: "lesson", estimatedMinutes: 35, description: "Master IAM concepts and create users with appropriate permissions." },
            { title: "IAM Policy Practice", type: "practice", estimatedMinutes: 30, description: "Write IAM policies for different access scenarios." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "AWS CLI Setup & Configuration", type: "lesson", estimatedMinutes: 25, description: "Install and configure the AWS CLI." },
            { title: "CLI Practice Exercises", type: "practice", estimatedMinutes: 25, description: "Manage IAM and basic resources using the CLI." },
          ]},
          { label: "Thursday", tasks: [
            { title: "AWS Global Infrastructure", type: "lesson", estimatedMinutes: 30, description: "Understand regions, AZs, edge locations, and CloudFront." },
            { title: "Region Selection Exercise", type: "practice", estimatedMinutes: 20, description: "Choose optimal regions for different application scenarios." },
          ]},
          { label: "Friday", tasks: [
            { title: "AWS Fundamentals Quiz", type: "quiz", estimatedMinutes: 20, description: "Test cloud concepts and IAM knowledge." },
            { title: "Review & Setup Verification", type: "review", estimatedMinutes: 25, description: "Verify all setup and review key concepts." },
          ]},
        ],
      },
      {
        title: "Compute: EC2 & Lambda",
        goals: ["Launch and manage EC2 instances", "Write Lambda functions", "Compare compute options"],
        days: [
          { label: "Monday", tasks: [
            { title: "EC2 Instances & AMIs", type: "lesson", estimatedMinutes: 35, description: "Learn instance types, AMIs, and launching instances." },
            { title: "Launch Your First EC2", type: "practice", estimatedMinutes: 30, description: "Launch and connect to a Linux EC2 instance." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Security Groups & Key Pairs", type: "lesson", estimatedMinutes: 30, description: "Configure security groups and SSH access properly." },
            { title: "Security Group Configuration", type: "practice", estimatedMinutes: 25, description: "Set up tiered security groups for a web application." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "AWS Lambda Fundamentals", type: "lesson", estimatedMinutes: 35, description: "Learn serverless computing with Lambda and write your first function." },
            { title: "Lambda Function Practice", type: "practice", estimatedMinutes: 30, description: "Create a Lambda function triggered by an API Gateway." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Elastic Beanstalk & Auto Scaling", type: "lesson", estimatedMinutes: 30, description: "Learn PaaS deployment and auto-scaling groups." },
            { title: "Deploy to Elastic Beanstalk", type: "project", estimatedMinutes: 40, description: "Deploy a web application using Elastic Beanstalk." },
          ]},
          { label: "Friday", tasks: [
            { title: "Compute Quiz", type: "quiz", estimatedMinutes: 20, description: "Test EC2, Lambda, and compute service knowledge." },
            { title: "Compute Comparison Review", type: "review", estimatedMinutes: 25, description: "Compare compute options and when to use each." },
          ]},
        ],
      },
      {
        title: "Storage: S3 & Databases",
        goals: ["Master S3 buckets and policies", "Set up RDS databases", "Choose the right storage"],
        days: [
          { label: "Monday", tasks: [
            { title: "S3 Buckets & Objects", type: "lesson", estimatedMinutes: 30, description: "Learn S3 basics, object storage, and bucket configuration." },
            { title: "S3 Upload & Management", type: "practice", estimatedMinutes: 25, description: "Create buckets and upload files via console and CLI." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "S3 Policies & Versioning", type: "lesson", estimatedMinutes: 30, description: "Configure bucket policies, versioning, and lifecycle rules." },
            { title: "S3 Static Website Hosting", type: "practice", estimatedMinutes: 30, description: "Host a static website on S3 with proper bucket policy." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "RDS Setup & Management", type: "lesson", estimatedMinutes: 35, description: "Launch a MySQL RDS instance and configure access." },
            { title: "RDS Configuration Practice", type: "practice", estimatedMinutes: 30, description: "Set up RDS with proper security groups and connect from EC2." },
          ]},
          { label: "Thursday", tasks: [
            { title: "DynamoDB Basics", type: "lesson", estimatedMinutes: 35, description: "Learn NoSQL with DynamoDB — tables, items, and queries." },
            { title: "DynamoDB CRUD Operations", type: "project", estimatedMinutes: 40, description: "Build a simple note-taking API with DynamoDB and Lambda." },
          ]},
          { label: "Friday", tasks: [
            { title: "Storage Quiz", type: "quiz", estimatedMinutes: 20, description: "Test S3, RDS, and DynamoDB knowledge." },
            { title: "Storage Selection Guide", type: "review", estimatedMinutes: 25, description: "Create a guide for choosing between storage services." },
          ]},
        ],
      },
      {
        title: "Networking & Content Delivery",
        goals: ["Configure VPCs and subnets", "Set up CloudFront distributions", "Understand Route 53"],
        days: [
          { label: "Monday", tasks: [
            { title: "VPC Fundamentals", type: "lesson", estimatedMinutes: 35, description: "Learn VPC, subnets, route tables, and internet gateways." },
            { title: "VPC Configuration", type: "practice", estimatedMinutes: 30, description: "Create a VPC with public and private subnets." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "Load Balancers (ALB/NLB)", type: "lesson", estimatedMinutes: 35, description: "Set up Application Load Balancer for traffic distribution." },
            { title: "ALB Setup & Target Groups", type: "practice", estimatedMinutes: 30, description: "Configure an ALB with EC2 target groups." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "CloudFront CDN", type: "lesson", estimatedMinutes: 30, description: "Set up CloudFront distribution for S3 content delivery." },
            { title: "CloudFront with S3", type: "practice", estimatedMinutes: 30, description: "Configure CloudFront to serve S3 website content globally." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Route 53 DNS Management", type: "lesson", estimatedMinutes: 30, description: "Learn DNS configuration, domain registration, and routing policies." },
            { title: "Route 53 Configuration", type: "project", estimatedMinutes: 40, description: "Set up DNS for a web application with health checks." },
          ]},
          { label: "Friday", tasks: [
            { title: "Networking Quiz", type: "quiz", estimatedMinutes: 20, description: "Test VPC, ALB, CloudFront, and Route 53 knowledge." },
            { title: "Architecture Diagram Review", type: "review", estimatedMinutes: 25, description: "Draw and review a complete networking architecture." },
          ]},
        ],
      },
      {
        title: "Serverless & Final Project",
        goals: ["Build a serverless application", "Implement monitoring", "Deploy a complete architecture"],
        days: [
          { label: "Monday", tasks: [
            { title: "API Gateway & Lambda Integration", type: "lesson", estimatedMinutes: 35, description: "Build REST APIs with API Gateway and Lambda." },
            { title: "API Gateway Configuration", type: "practice", estimatedMinutes: 30, description: "Create a RESTful API with multiple endpoints." },
          ]},
          { label: "Tuesday", tasks: [
            { title: "CloudWatch & Monitoring", type: "lesson", estimatedMinutes: 30, description: "Set up CloudWatch alarms, logs, and dashboards." },
            { title: "Monitoring Dashboard", type: "practice", estimatedMinutes: 30, description: "Create a CloudWatch dashboard for your infrastructure." },
          ]},
          { label: "Wednesday", tasks: [
            { title: "Serverless Application Architecture", type: "lesson", estimatedMinutes: 30, description: "Learn patterns for event-driven serverless architectures." },
            { title: "Final Project: Serverless App", type: "project", estimatedMinutes: 45, description: "Build a serverless image processing app with S3, Lambda, and DynamoDB." },
          ]},
          { label: "Thursday", tasks: [
            { title: "Infrastructure as Code (CloudFormation Intro)", type: "lesson", estimatedMinutes: 30, description: "Learn to define infrastructure using CloudFormation templates." },
            { title: "CloudFormation Template", type: "project", estimatedMinutes: 40, description: "Write a CloudFormation template for your serverless application." },
          ]},
          { label: "Friday", tasks: [
            { title: "Final Assessment", type: "quiz", estimatedMinutes: 25, description: "Comprehensive assessment covering all AWS services." },
            { title: "Course Review & Certification Path", type: "review", estimatedMinutes: 25, description: "Review your AWS journey and explore certification options." },
          ]},
        ],
      },
    ],
  },
];

export const planCategories = [...new Set(planTemplates.map((t) => t.category))];
export const planDifficulties = ["beginner", "intermediate", "advanced"];

export default planTemplates;
