import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { connectSeriesDB } from '../config/seriesDatabase.js';
import TableQuiz from '../src/models/TableQuiz.js';
import TableSeries from '../src/models/TableSeries.js';

const tableQuizData = [
  {
    tableId: 1,
    name: "Psychology Defense Mechanisms",
    rows: 4,
    columns: 3,
    subject: "Psychology",
    chapter: "Defense Mechanisms",
    section: "Types and Examples",
    tags: ["psychology", "defense", "mechanisms"],
    cells: [
      { row: 0, column: 0, text: "Defense Mechanism", isHeader: true },
      { row: 0, column: 1, text: "Definition", isHeader: true },
      { row: 0, column: 2, text: "Example", isHeader: true },
      { row: 1, column: 0, text: "Denial", isHeader: false },
      { row: 1, column: 1, text: "Refusing to accept reality", isHeader: false },
      { row: 1, column: 2, text: "I am not sick", isHeader: false },
      { row: 2, column: 0, text: "Projection", isHeader: false },
      { row: 2, column: 1, text: "Attributing own feelings to others", isHeader: false },
      { row: 2, column: 2, text: "You hate me", isHeader: false },
      { row: 3, column: 0, text: "Rationalization", isHeader: false },
      { row: 3, column: 1, text: "Creating logical excuses", isHeader: false },
      { row: 3, column: 2, text: "", isHeader: false }
    ]
  },
  {
    tableId: 2,
    name: "Cognitive Biases",
    rows: 3,
    columns: 3,
    subject: "Psychology",
    chapter: "Cognitive Psychology",
    section: "Decision Making",
    tags: ["psychology", "cognitive", "biases"],
    cells: [
      { row: 0, column: 0, text: "Bias Type", isHeader: true },
      { row: 0, column: 1, text: "Description", isHeader: true },
      { row: 0, column: 2, text: "Example", isHeader: true },
      { row: 1, column: 0, text: "Confirmation Bias", isHeader: false },
      { row: 1, column: 1, text: "Seeking confirming evidence", isHeader: false },
      { row: 1, column: 2, text: "Only reading agreeable news", isHeader: false },
      { row: 2, column: 0, text: "Anchoring Bias", isHeader: false },
      { row: 2, column: 1, text: "Over-relying on first information", isHeader: false },
      { row: 2, column: 2, text: "Price negotiations", isHeader: false }
    ]
  },
  {
    tableId: 3,
    name: "Learning Theories Comparison",
    rows: 4,
    columns: 4,
    subject: "Education",
    chapter: "Learning Theories",
    section: "Behaviorism vs Cognitivism",
    tags: ["education", "learning", "theories"],
    cells: [
      { row: 0, column: 0, text: "", isHeader: true },
      { row: 0, column: 1, text: "Behaviorism", isHeader: true },
      { row: 0, column: 2, text: "Cognitivism", isHeader: true },
      { row: 0, column: 3, text: "Constructivism", isHeader: true },
      { row: 1, column: 0, text: "Focus", isHeader: true },
      { row: 1, column: 1, text: "Observable behavior", isHeader: false },
      { row: 1, column: 2, text: "Mental processes", isHeader: false },
      { row: 1, column: 3, text: "Knowledge building", isHeader: false },
      { row: 2, column: 0, text: "Key Theorist", isHeader: true },
      { row: 2, column: 1, text: "B.F. Skinner", isHeader: false },
      { row: 2, column: 2, text: "Jean Piaget", isHeader: false },
      { row: 2, column: 3, text: "Lev Vygotsky", isHeader: false },
      { row: 3, column: 0, text: "Method", isHeader: true },
      { row: 3, column: 1, text: "Conditioning", isHeader: false },
      { row: 3, column: 2, text: "Information processing", isHeader: false },
      { row: 3, column: 3, text: "Social interaction", isHeader: false }
    ]
  },
  {
    tableId: 4,
    name: "Programming Paradigms",
    rows: 3,
    columns: 4,
    subject: "Computer Science",
    chapter: "Programming Concepts",
    section: "Paradigms Overview",
    tags: ["programming", "paradigms", "computer-science"],
    cells: [
      { row: 0, column: 0, text: "Paradigm", isHeader: true },
      { row: 0, column: 1, text: "Key Feature", isHeader: true },
      { row: 0, column: 2, text: "Example Language", isHeader: true },
      { row: 0, column: 3, text: "Use Case", isHeader: true },
      { row: 1, column: 0, text: "Object-Oriented", isHeader: false },
      { row: 1, column: 1, text: "Encapsulation", isHeader: false },
      { row: 1, column: 2, text: "Java", isHeader: false },
      { row: 1, column: 3, text: "Large applications", isHeader: false },
      { row: 2, column: 0, text: "Functional", isHeader: false },
      { row: 2, column: 1, text: "Immutability", isHeader: false },
      { row: 2, column: 2, text: "Haskell", isHeader: false },
      { row: 2, column: 3, text: "Data processing", isHeader: false }
    ]
  }
];

const seedTableQuizzes = async () => {
  try {
    console.log('🌱 Starting table quiz data seeding...');

    // Connect to databases
    await connectDB();
    await connectSeriesDB();

    // Clear existing table quiz data
    await TableQuiz.deleteMany({});
    console.log('✅ Cleared existing table quiz data');

    // Insert table quiz data into content.table collection
    const insertedTables = await TableQuiz.insertMany(tableQuizData);
    console.log(`✅ Inserted ${insertedTables.length} table quizzes into content.table collection`);

    // Create sample table series in series.tables collection
    const sampleSeries = [
      {
        title: "Psychology Fundamentals Study",
        status: "active",
        sessions: [
          {
            sessionId: 1,
            status: "completed",
            tables: [
              {
                tableId: 1,
                interaction: {
                  userGrid: [
                    ["Defense Mechanism", "Definition", "Example"],
                    ["Denial", "Refusing to accept reality", "I am not sick"],
                    ["Projection", "Attributing own feelings to others", "You hate me"],
                    ["Rationalization", "Creating logical excuses", ""]
                  ],
                  results: {
                    correctPlacements: 11,
                    totalCells: 12,
                    accuracy: 92,
                    wrongPlacements: [
                      {
                        cellText: "Wrong placement",
                        placedAtRow: 3,
                        placedAtColumn: 2,
                        correctRow: 3,
                        correctColumn: 2,
                        correctCellText: ""
                      }
                    ]
                  },
                  difficulty: "Medium",
                  confidenceWhileSolving: "High",
                  timeSpent: 145
                }
              }
            ],
            startedAt: new Date("2024-12-20T10:30:00Z"),
            completedAt: new Date("2024-12-20T10:35:00Z")
          }
        ]
      },
      {
        title: "Computer Science Fundamentals",
        status: "active",
        sessions: []
      }
    ];

    // Clear existing table series data
    await TableSeries.deleteMany({});
    console.log('✅ Cleared existing table series data');

    // Insert table series data into series.tables collection
    const insertedSeries = await TableSeries.insertMany(sampleSeries);
    console.log(`✅ Inserted ${insertedSeries.length} table series into series.tables collection`);

    console.log('\n🎯 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   content.table collection: ${insertedTables.length} table quizzes`);
    console.log(`   series.tables collection: ${insertedSeries.length} table series`);
    console.log('\n🚀 Table quiz system ready for testing with real database!');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedTableQuizzes();