import mongoose from 'mongoose';

const findContent = async () => {
  try {
    console.log('🔍 Searching for content across databases...');

    const databases = [
      'flashcards',
      'flashcardstudyingapp',
      'content',
      'series'
    ];

    for (const dbName of databases) {
      try {
        const dbUri = `mongodb+srv://hajishihade:MyPassword123@cluster0.f1wszdy.mongodb.net/${dbName}?retryWrites=true&w=majority`;
        const connection = await mongoose.createConnection(dbUri);

        console.log(`\n📊 Checking database: ${dbName}`);

        // Check flashcards
        try {
          const FlashcardModel = connection.model('Flashcard', new mongoose.Schema({}, { strict: false }), 'flashcards');
          const flashcardCount = await FlashcardModel.countDocuments();
          console.log(`  📚 Flashcards: ${flashcardCount}`);
        } catch (e) {
          console.log(`  📚 Flashcards: collection not found`);
        }

        // Check MCQs
        try {
          const MCQModel = connection.model('MCQ', new mongoose.Schema({}, { strict: false }), 'mcqs');
          const mcqCount = await MCQModel.countDocuments();
          console.log(`  🧠 MCQs: ${mcqCount}`);
        } catch (e) {
          console.log(`  🧠 MCQs: collection not found`);
        }

        await connection.close();
      } catch (error) {
        console.log(`❌ Database ${dbName}: ${error.message}`);
      }
    }

    console.log('\n🎯 Search complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Search failed:', error);
    process.exit(1);
  }
};

findContent();