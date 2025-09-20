import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { connectSeriesDB, seriesConnection } from '../config/seriesDatabase.js';

const completeDataMigration = async () => {
  try {
    console.log('🚀 Starting complete data migration...');

    // Connect to both databases
    await connectDB();
    await connectSeriesDB();

    console.log('✅ Connected to both content and series databases');

    // Get old models from the original database connection
    const originalConnection = mongoose.connection;

    // Old models (from original database)
    const OldSeries = originalConnection.model('Series', new mongoose.Schema({}, { strict: false }));
    const OldMCQSeries = originalConnection.model('MCQSeries', new mongoose.Schema({}, { strict: false }));

    // New models (for series database)
    const FlashcardSeriesSchema = new mongoose.Schema({
      title: String,
      status: String,
      sessions: [],
      startedAt: Date,
      completedAt: Date
    }, { collection: 'flashcards' });

    const MCQSeriesSchema = new mongoose.Schema({
      title: String,
      status: String,
      sessions: [],
      startedAt: Date,
      completedAt: Date
    }, { collection: 'mcqs' });

    const NewFlashcardSeries = seriesConnection.model('FlashcardSeries', FlashcardSeriesSchema);
    const NewMCQSeries = seriesConnection.model('MCQSeries', MCQSeriesSchema);

    // Step 1: Clear existing data in new databases to prevent conflicts
    console.log('🧹 Clearing any existing data in new databases...');
    await NewFlashcardSeries.deleteMany({});
    await NewMCQSeries.deleteMany({});
    console.log('✅ New databases cleared');

    // Step 2: Migrate flashcard series
    console.log('📋 Migrating flashcard series...');
    const existingSeries = await OldSeries.find({}).lean();
    console.log(`Found ${existingSeries.length} flashcard series to migrate`);

    for (const oldSeries of existingSeries) {
      try {
        const newSeries = new NewFlashcardSeries({
          title: oldSeries.title,
          status: oldSeries.status,
          sessions: oldSeries.sessions || [],
          startedAt: oldSeries.startedAt,
          completedAt: oldSeries.completedAt
        });

        await newSeries.save();
        console.log(`✅ Migrated flashcard series: "${oldSeries.title}"`);
      } catch (error) {
        console.error(`❌ Failed to migrate flashcard series "${oldSeries.title}":`, error.message);
      }
    }

    // Step 3: Migrate MCQ series
    console.log('📋 Migrating MCQ series...');
    const existingMCQSeries = await OldMCQSeries.find({}).lean();
    console.log(`Found ${existingMCQSeries.length} MCQ series to migrate`);

    for (const oldMCQSeries of existingMCQSeries) {
      try {
        const newMCQSeries = new NewMCQSeries({
          title: oldMCQSeries.title,
          status: oldMCQSeries.status,
          sessions: oldMCQSeries.sessions || [],
          startedAt: oldMCQSeries.startedAt,
          completedAt: oldMCQSeries.completedAt
        });

        await newMCQSeries.save();
        console.log(`✅ Migrated MCQ series: "${oldMCQSeries.title}"`);
      } catch (error) {
        console.error(`❌ Failed to migrate MCQ series "${oldMCQSeries.title}":`, error.message);
      }
    }

    // Step 4: Verify migration
    const migratedFlashcards = await NewFlashcardSeries.countDocuments();
    const migratedMCQs = await NewMCQSeries.countDocuments();

    console.log('📊 Migration Results:');
    console.log(`   Flashcard Series: ${existingSeries.length} → ${migratedFlashcards}`);
    console.log(`   MCQ Series: ${existingMCQSeries.length} → ${migratedMCQs}`);

    // Step 5: Drop old collections
    console.log('🗑️ Dropping old collections...');

    try {
      await originalConnection.db.collection('series').drop();
      console.log('✅ Dropped old "series" collection');
    } catch (error) {
      console.log('⚠️ Old "series" collection already gone or empty');
    }

    try {
      await originalConnection.db.collection('mcqseries').drop();
      console.log('✅ Dropped old "mcqseries" collection');
    } catch (error) {
      console.log('⚠️ Old "mcqseries" collection already gone or empty');
    }

    console.log('🎉 MIGRATION COMPLETE!');
    console.log('📊 New Database Structure:');
    console.log('   📚 Content Database: /content');
    console.log('      - flashcards collection (content only)');
    console.log('      - mcqs collection (content only)');
    console.log('   📈 Series Database: /series');
    console.log('      - flashcards collection (study sessions)');
    console.log('      - mcqs collection (study sessions)');
    console.log('');
    console.log('✅ Check MongoDB interface - you should now see "content" and "series" databases');

    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

completeDataMigration();