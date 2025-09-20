import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { connectSeriesDB, seriesConnection } from '../config/seriesDatabase.js';
import FlashcardSeries from '../src/models/FlashcardSeries.js';
import MCQSeriesNew from '../src/models/MCQSeriesNew.js';

// Get old models for migration
import Series from '../src/models/Series.js';
import MCQSeries from '../src/models/MCQSeries.js';

const initializeDatabases = async () => {
  try {
    console.log('🚀 Initializing new database structure...');

    // Connect to both databases
    await connectDB();
    await connectSeriesDB();

    console.log('✅ Databases connected successfully');

    // Create initial test documents to make databases visible
    console.log('📝 Creating test documents...');

    // Create test flashcard series in new series database
    const testFlashcardSeries = new FlashcardSeries({
      title: 'Test Flashcard Series',
      status: 'active',
      sessions: [{
        sessionId: 1,
        status: 'completed',
        cards: [{
          cardId: 1,
          interaction: {
            result: 'Right',
            difficulty: 'Medium',
            confidenceWhileSolving: 'High',
            timeSpent: 10
          }
        }]
      }]
    });

    await testFlashcardSeries.save();
    console.log('✅ Test flashcard series created in series database');

    // Create test MCQ series in new series database
    const testMCQSeries = new MCQSeriesNew({
      title: 'Test MCQ Series',
      status: 'active',
      sessions: [{
        sessionId: 1,
        status: 'completed',
        questions: [{
          questionId: 1,
          interaction: {
            selectedAnswer: 'A',
            isCorrect: true,
            difficulty: 'Medium',
            confidenceWhileSolving: 'High',
            timeSpent: 15
          }
        }]
      }]
    });

    await testMCQSeries.save();
    console.log('✅ Test MCQ series created in series database');

    console.log('🎯 Database initialization complete!');
    console.log('📊 New structure:');
    console.log('   Content Database: flashcards + mcqs (content only)');
    console.log('   Series Database: flashcards + mcqs collections (sessions only)');

    // Now migrate existing data
    console.log('🔄 Starting data migration...');

    // Migrate existing flashcard series
    const existingSeries = await Series.find({});
    console.log(`📋 Found ${existingSeries.length} existing flashcard series to migrate`);

    for (const oldSeries of existingSeries) {
      const newSeries = new FlashcardSeries({
        title: oldSeries.title,
        status: oldSeries.status,
        sessions: oldSeries.sessions,
        startedAt: oldSeries.startedAt,
        completedAt: oldSeries.completedAt
      });

      await newSeries.save();
      console.log(`✅ Migrated flashcard series: ${oldSeries.title}`);
    }

    // Migrate existing MCQ series
    const existingMCQSeries = await MCQSeries.find({});
    console.log(`📋 Found ${existingMCQSeries.length} existing MCQ series to migrate`);

    for (const oldMCQSeries of existingMCQSeries) {
      const newMCQSeries = new MCQSeriesNew({
        title: oldMCQSeries.title,
        status: oldMCQSeries.status,
        sessions: oldMCQSeries.sessions,
        startedAt: oldMCQSeries.startedAt,
        completedAt: oldMCQSeries.completedAt
      });

      await newMCQSeries.save();
      console.log(`✅ Migrated MCQ series: ${oldMCQSeries.title}`);
    }

    console.log('🎉 Data migration complete!');
    console.log('📊 You should now see "content" and "series" databases in MongoDB');

    process.exit(0);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

initializeDatabases();