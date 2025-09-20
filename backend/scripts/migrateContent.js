import mongoose from 'mongoose';

const migrateContent = async () => {
  try {
    console.log('🚀 Migrating content to new database structure...');

    // Connect to old database (flashcards)
    const oldDbUri = 'mongodb+srv://hajishihade:MyPassword123@cluster0.f1wszdy.mongodb.net/flashcards?retryWrites=true&w=majority';
    const oldConnection = await mongoose.createConnection(oldDbUri);
    console.log('✅ Connected to old flashcards database');

    // Connect to new content database
    const contentDbUri = 'mongodb+srv://hajishihade:MyPassword123@cluster0.f1wszdy.mongodb.net/content?retryWrites=true&w=majority';
    const contentConnection = await mongoose.createConnection(contentDbUri);
    console.log('✅ Connected to new content database');

    // Define schemas for migration
    const FlashcardSchema = new mongoose.Schema({}, { strict: false });
    const MCQSchema = new mongoose.Schema({}, { strict: false });

    // Old models
    const OldFlashcard = oldConnection.model('Flashcard', FlashcardSchema, 'flashcards');
    const OldMCQ = oldConnection.model('MCQ', MCQSchema, 'mcqs');

    // New models
    const NewFlashcard = contentConnection.model('Flashcard', FlashcardSchema, 'flashcards');
    const NewMCQ = contentConnection.model('MCQ', MCQSchema, 'mcqs');

    // Migrate flashcards
    console.log('📋 Migrating flashcards...');
    const flashcards = await OldFlashcard.find({}).lean();
    console.log(`Found ${flashcards.length} flashcards to migrate`);

    if (flashcards.length > 0) {
      await NewFlashcard.deleteMany({}); // Clear any existing data
      await NewFlashcard.insertMany(flashcards);
      console.log(`✅ Migrated ${flashcards.length} flashcards to content database`);
    }

    // Migrate MCQs
    console.log('📋 Migrating MCQs...');
    const mcqs = await OldMCQ.find({}).lean();
    console.log(`Found ${mcqs.length} MCQs to migrate`);

    if (mcqs.length > 0) {
      await NewMCQ.deleteMany({}); // Clear any existing data
      await NewMCQ.insertMany(mcqs);
      console.log(`✅ Migrated ${mcqs.length} MCQs to content database`);
    }

    // Verify migration
    const migratedFlashcards = await NewFlashcard.countDocuments();
    const migratedMCQs = await NewMCQ.countDocuments();

    console.log('📊 Content Migration Results:');
    console.log(`   Flashcards: ${flashcards.length} → ${migratedFlashcards}`);
    console.log(`   MCQs: ${mcqs.length} → ${migratedMCQs}`);

    console.log('🎉 CONTENT MIGRATION COMPLETE!');
    console.log('📊 Final Database Structure:');
    console.log('   📚 Content Database: /content');
    console.log(`      - flashcards: ${migratedFlashcards} items`);
    console.log(`      - mcqs: ${migratedMCQs} items`);
    console.log('   📈 Series Database: /series');
    console.log('      - flashcards: study sessions');
    console.log('      - mcqs: study sessions');

    await oldConnection.close();
    await contentConnection.close();

    console.log('✅ NOW CHECK MongoDB - you should see "content" and "series" databases!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Content migration failed:', error);
    process.exit(1);
  }
};

migrateContent();