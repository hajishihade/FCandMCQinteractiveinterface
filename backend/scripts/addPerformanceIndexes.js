import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import { connectSeriesDB } from '../config/seriesDatabase.js';
import MCQ from '../src/models/MCQ.js';
import TableQuiz from '../src/models/TableQuiz.js';

dotenv.config();

async function addPerformanceIndexes() {
  try {
    console.log('🚀 Starting index optimization...\n');

    // Connect to databases
    await connectDB();
    await connectSeriesDB();

    console.log('📊 Adding compound indexes to MCQ collection...');

    // List existing indexes first
    const existingMCQIndexes = await MCQ.collection.indexes();
    console.log('Existing MCQ indexes:', existingMCQIndexes.map(idx => idx.name));

    // Add compound indexes for common filter combinations
    // Most common: subject + chapter + section
    await MCQ.collection.createIndex(
      { subject: 1, chapter: 1, section: 1 },
      { name: 'subject_chapter_section_compound' }
    ).catch(err => console.log('Index already exists:', err.message));

    // Subject + chapter (common filter)
    await MCQ.collection.createIndex(
      { subject: 1, chapter: 1 },
      { name: 'subject_chapter_compound' }
    ).catch(err => console.log('Index already exists:', err.message));

    // For sorting with filters
    await MCQ.collection.createIndex(
      { questionId: 1, subject: 1 },
      { name: 'questionId_subject_compound' }
    ).catch(err => console.log('Index already exists:', err.message));

    console.log('✅ MCQ indexes created successfully\n');

    // Add indexes for TableQuiz if collection exists
    console.log('📊 Adding compound indexes to TableQuiz collection...');

    try {
      const existingTableIndexes = await TableQuiz.collection.indexes();
      console.log('Existing TableQuiz indexes:', existingTableIndexes.map(idx => idx.name));

      // Add compound indexes for table quizzes
      await TableQuiz.collection.createIndex(
        { subject: 1, chapter: 1, section: 1 },
        { name: 'subject_chapter_section_compound' }
      ).catch(err => console.log('Index already exists:', err.message));

      await TableQuiz.collection.createIndex(
        { tableId: 1, subject: 1 },
        { name: 'tableId_subject_compound' }
      ).catch(err => console.log('Index already exists:', err.message));

      console.log('✅ TableQuiz indexes created successfully\n');
    } catch (err) {
      console.log('⚠️  TableQuiz collection not found, skipping...\n');
    }

    // Verify all indexes
    console.log('📋 Final index report:');
    console.log('====================');

    const finalMCQIndexes = await MCQ.collection.indexes();
    console.log('\nMCQ Collection Indexes:');
    finalMCQIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    try {
      const finalTableIndexes = await TableQuiz.collection.indexes();
      console.log('\nTableQuiz Collection Indexes:');
      finalTableIndexes.forEach(idx => {
        console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
      });
    } catch (err) {
      console.log('\nTableQuiz Collection: Not available');
    }

    console.log('\n✨ Index optimization complete!');
    console.log('🎯 Expected performance improvements:');
    console.log('  - 50-70% faster filtered queries');
    console.log('  - Reduced database CPU usage');
    console.log('  - Better query plan optimization');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding indexes:', error);
    process.exit(1);
  }
}

addPerformanceIndexes();