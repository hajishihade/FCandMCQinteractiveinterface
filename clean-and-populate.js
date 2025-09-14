import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomBool = (probability = 0.5) => Math.random() < probability;

const RESULTS = ['Right', 'Wrong'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const CONFIDENCES = ['High', 'Low'];

const generateRealisticTime = (difficulty, result) => {
  let baseTime;
  switch (difficulty) {
    case 'Easy': baseTime = randomInt(15, 45); break;
    case 'Medium': baseTime = randomInt(30, 90); break;
    case 'Hard': baseTime = randomInt(60, 180); break;
    default: baseTime = randomInt(30, 60);
  }
  if (result === 'Wrong') {
    baseTime = Math.floor(baseTime * randomChoice([1.2, 1.5, 2.0]));
  }
  return Math.min(baseTime, 300);
};

const generateRealisticConfidence = (difficulty, result) => {
  if (result === 'Right') {
    if (difficulty === 'Easy') return randomBool(0.8) ? 'High' : 'Low';
    if (difficulty === 'Medium') return randomBool(0.6) ? 'High' : 'Low';
    if (difficulty === 'Hard') return randomBool(0.3) ? 'High' : 'Low';
  } else {
    if (difficulty === 'Easy') return randomBool(0.3) ? 'High' : 'Low';
    if (difficulty === 'Medium') return randomBool(0.2) ? 'High' : 'Low';
    if (difficulty === 'Hard') return randomBool(0.1) ? 'High' : 'Low';
  }
  return 'Low';
};

// Clean database via manual cleanup note
const manualCleanupNote = () => {
  console.log('🧹 MANUAL CLEANUP NEEDED:');
  console.log('Please manually clear the series collection in MongoDB Atlas');
  console.log('Then run this script to populate with clean data following new rules\n');
};

// Create clean series following ONE ACTIVE SESSION rule
const createCleanSeries = async () => {
  const seriesTemplates = [
    {
      title: "Mathematics Advanced Topics",
      sessions: [
        { cards: [0, 1, 2, 3], shouldComplete: true },
        { cards: [1, 2, 3], shouldComplete: true },
        { cards: [4, 5, 6], shouldComplete: false } // ONE active session
      ]
    },
    {
      title: "Physics Mechanics Study",
      sessions: [
        { cards: [7, 8, 9], shouldComplete: true },
        { cards: [0, 2, 4], shouldComplete: false } // ONE active session
      ]
    },
    {
      title: "Chemistry Fundamentals",
      sessions: [
        { cards: [1, 3, 5, 7], shouldComplete: true } // All completed
      ]
    },
    {
      title: "Biology Cell Structure",
      sessions: [
        { cards: [2, 4, 6, 8], shouldComplete: true },
        { cards: [9, 0, 1], shouldComplete: true },
        { cards: [3, 5], shouldComplete: false } // ONE active session
      ]
    },
    {
      title: "Quick Review Topics",
      sessions: [
        { cards: [6, 7, 8], shouldComplete: false } // ONE active session only
      ]
    }
  ];

  console.log('📚 Creating clean series using APIs with new logic...\n');

  for (const template of seriesTemplates) {
    try {
      console.log(`🎯 Creating: ${template.title}`);

      // Step 1: Create series
      const seriesResponse = await axios.post(`${API_BASE}/series`, {
        title: template.title
      });
      const seriesId = seriesResponse.data.data.seriesId;
      console.log(`  ✅ Series created: ${seriesId}`);

      // Step 2: Create sessions
      for (let sessionIndex = 0; sessionIndex < template.sessions.length; sessionIndex++) {
        const sessionTemplate = template.sessions[sessionIndex];
        const generatedFrom = sessionIndex > 0 ? sessionIndex : null;

        console.log(`  📝 Creating session ${sessionIndex + 1} with cards: [${sessionTemplate.cards.join(', ')}]`);

        // Create session (cards added with null interactions)
        const sessionResponse = await axios.post(`${API_BASE}/series/${seriesId}/sessions`, {
          cardIds: sessionTemplate.cards,
          generatedFrom
        });
        const sessionId = sessionResponse.data.data.sessionId;

        // Step 3: Add interactions and complete if needed
        if (sessionTemplate.shouldComplete) {
          console.log(`    💯 Adding interactions and completing session ${sessionId}`);

          // Add random interactions for each card
          for (const cardId of sessionTemplate.cards) {
            const difficulty = randomChoice(DIFFICULTIES);
            const result = randomBool(0.7) ? 'Right' : 'Wrong';
            const confidence = generateRealisticConfidence(difficulty, result);
            const timeSpent = generateRealisticTime(difficulty, result);

            await axios.post(`${API_BASE}/series/${seriesId}/sessions/${sessionId}/interactions`, {
              cardId,
              result,
              difficulty,
              confidenceWhileSolving: confidence,
              timeSpent
            });
          }

          // Complete the session
          await axios.put(`${API_BASE}/series/${seriesId}/sessions/${sessionId}/complete`);
          console.log(`    ✅ Session ${sessionId} completed`);
        } else {
          console.log(`    🔵 Session ${sessionId} left active (ready for study/edit)`);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`🎉 Completed: ${template.title}\n`);

    } catch (error) {
      console.error(`❌ Error creating ${template.title}:`, error.response?.data || error.message);
    }
  }
};

// Main execution
const main = async () => {
  console.log('🚀 Clean Series Population Script\n');

  manualCleanupNote();
  await createCleanSeries();

  console.log('✨ Population complete!');
  console.log('🎯 You now have clean series following the new rules:');
  console.log('   ✅ Cards populated immediately in sessions');
  console.log('   ✅ ONE active session per series maximum');
  console.log('   ✅ Clean edit/delete functionality ready');
  console.log('   ✅ Realistic interaction data');
  console.log('\n🎮 Ready to test frontend edit/delete functionality!');
};

main().catch(console.error);