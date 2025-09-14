import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const fixMultipleActiveSessions = async () => {
  try {
    console.log('🔍 Finding series with multiple active sessions...');

    // Get all series
    const response = await axios.get(`${API_BASE}/series?limit=100`);
    const allSeries = response.data.data;

    let fixedCount = 0;

    for (const series of allSeries) {
      const activeSessions = series.sessions.filter(s => s.status === 'active');

      if (activeSessions.length > 1) {
        console.log(`\n🚨 Found ${activeSessions.length} active sessions in "${series.title}"`);
        console.log(`   Active sessions: ${activeSessions.map(s => s.sessionId).join(', ')}`);

        // Complete all but the last active session (keep the newest)
        const sessionsToComplete = activeSessions.slice(0, -1);

        for (const session of sessionsToComplete) {
          try {
            await axios.put(`${API_BASE}/series/${series._id}/sessions/${session.sessionId}/complete`);
            console.log(`   ✅ Completed session ${session.sessionId}`);
          } catch (error) {
            console.log(`   ⚠️  Session ${session.sessionId} already completed or error:`, error.response?.data?.message);
          }
        }

        const keepActiveSession = activeSessions[activeSessions.length - 1];
        console.log(`   🔵 Keeping session ${keepActiveSession.sessionId} as active`);

        fixedCount++;
      }
    }

    console.log(`\n✨ Fixed ${fixedCount} series with multiple active sessions`);

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const updatedResponse = await axios.get(`${API_BASE}/series?limit=100`);
    const updatedSeries = updatedResponse.data.data;

    const stillProblematic = updatedSeries.filter(series => {
      const activeSessions = series.sessions.filter(s => s.status === 'active');
      return activeSessions.length > 1;
    });

    if (stillProblematic.length === 0) {
      console.log('✅ All series now have maximum one active session!');
    } else {
      console.log(`❌ Still ${stillProblematic.length} series with multiple active sessions`);
    }

  } catch (error) {
    console.error('❌ Error fixing multiple active sessions:', error.response?.data || error.message);
  }
};

fixMultipleActiveSessions();